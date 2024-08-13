import {ItemsServiceCreator, ServerServiceCreator} from "../helpers/ItemsServiceCreator";
import {CollectionNames} from "../helpers/CollectionNames";
import {TranslationHelper} from "../helpers/TranslationHelper";
import {FlowStatus} from "../helpers/AppSettingsHelper";
import {ApiContext} from "../helpers/ApiContext";
import {MyDatabaseHelper} from "../helpers/MyDatabaseHelper";


const TABLENAME_MEALS = CollectionNames.FOODS
const TABLENAME_FOODS_FEEDBACKS = CollectionNames.FOODS_FEEDBACKS
const TABLENAME_FOODOFFERS = CollectionNames.FOODOFFERS

const SCHEDULE_NAME = "FoodNotifySchedule";

const DefaultLanguage = TranslationHelper.LANGUAGE_CODE_DE
const FallBackLanguage = TranslationHelper.LANGUAGE_CODE_EN

export class NotifySchedule {

    private databaseHelper: MyDatabaseHelper;
    private apiContext: ApiContext;

    constructor(
        apiExtensionContext: ApiContext
    ) {
        this.apiContext = apiExtensionContext;
        this.databaseHelper = new MyDatabaseHelper(apiExtensionContext);
        this.finished = true;
    }
    
    // Todo create/generate documentation 

    async init(getSchema, services, database, logger) {
        this.schema = await getSchema();
        this.database = database;
        this.logger = logger;
        this.services = services;
        this.itemsServiceCreator = new ItemsServiceCreator(this.apiContext);
        this.serverServiceCreator = new ServerServiceCreator(this.apiContext);
        await this.getProjectName();
    }

    async setStatus(status: FlowStatus) {
        await this.databaseHelper.getAppSettingsHelper().setFoodNotificationStatus(status)
    }

    async notify(aboutMealsInDays = 1, force = false) {
        let enabled = true
        let status = await this.databaseHelper.getAppSettingsHelper().getFoodNotificationStatus();

        this.finished = !!this.finished;

        if ((enabled && status === FlowStatus.START && this.finished) || force) {
            console.log("[Start] "+SCHEDULE_NAME+" Schedule");
            console.log("Notify about meals in "+aboutMealsInDays+" days - force: "+force);
            this.finished = false;
            //console.log("Set status to running");
            await this.databaseHelper.getAppSettingsHelper().setFoodNotificationStatus(FlowStatus.RUNNING);

            try {
                // We need to notify all devices, which want to get notified about new food offers which they are interested in

                // Step 1: Get all food offers at aboutMealsInDays days in the future
                //console.log("Get all food offers at aboutMealsInDays days in the future");
                let date = new Date()
                date.setDate(date.getDate() + aboutMealsInDays);
                //console.log("Date: "+date.toISOString());
                let foodOffers = await this.getFoodOffersForDate(date);
                //console.log("Found "+foodOffers.length+" food offers for "+date.toISOString());

                for (let foodOffer of foodOffers) {
                    //console.log("Notify about food offer: "+foodOffer.id);
                    let food_id = foodOffer.food;
                    let foodWithTranslations = await this.getFoodWithTranslations(food_id);


                    let food_offer_in_canteen_id = foodOffer.canteen;
                    //console.log("Food offer is in canteen: "+food_offer_in_canteen_id);

                    // Step 2: Get all food_feedbacks which want to get notified about this food
                    let foodFeedbacks = await this.getFoodFeedbacksForFood(food_id);
                    //console.log("Found "+foodFeedbacks.length+" food feedbacks for food "+food_id);

                    for (let foodFeedback of foodFeedbacks) {
                        let profile_id = foodFeedback.profile;
                        //console.log("Notify profile: "+profile_id+" about food: "+food_id);
                        // Step 3: Get the profile and all devices of the profile
                        let profile = await this.getProfileAndDevicesForProfile(profile_id);
                        let language = profile.language;
                        let profile_canteen_id = profile.canteen;

                        // Step 3.1: Check if the profile is interested in the canteen
                        if (profile_canteen_id !== food_offer_in_canteen_id) {
                            //console.log("Profile is not interested in this canteen");
                            continue;
                        } else {
                            //console.log("Profile is interested in this canteen");
                        }

                        for (let device of profile.devices) {
                            //console.log("Notify device: "+device.id+" about food: "+food_id);
                            // Step 4: Send the notification to the device, where pushTokenObj is not null
                            if (device.pushTokenObj !== null) {
                                // Step 5: Send the notification to the device
                                await this.notifyDeviceAboutFoodOffer(device, foodOffer, foodWithTranslations, language, aboutMealsInDays, date);

                            } else {
                                //console.log("Device has no push token");
                            }
                        }
                    }
                }
                //console.log("Finished");
                this.finished = true;
                await this.setStatus(FlowStatus.FINISHED);
            } catch (err) {
                console.log("["+SCHEDULE_NAME+"] Failed");
                console.log(err);
                this.finished = true;
                await this.setStatus(FlowStatus.FAILED);
            }

        } else if (!this.finished && status !== FlowStatus.RUNNING) {
            await this.setStatus(FlowStatus.RUNNING);
        }
    }

    async notifyDeviceAboutFoodOffer(device, foodOffer, foodWithTranslations, language, aboutMealsInDays, date) {
        // Create a new push_notification entry in the database
        let pushNotificationService = await this.itemsServiceCreator.getItemsService(CollectionNames.PUSH_NOTIFICATIONS);
        let pushTokenObj = device.pushTokenObj;
        /**
         pushTokenObj = {
                "permission": {
                "status": "granted",
                    "canAskAgain": true,
                    "ios": {
                    "allowsSound": true,
                        "allowsCriticalAlerts": null,
                        "allowsAlert": true,
                        "allowsDisplayOnLockScreen": true,
                        "allowsDisplayInNotificationCenter": true,
                        "providesAppNotificationSettings": false,
                        "allowsDisplayInCarPlay": null,
                        "allowsAnnouncements": false,
                        "allowsBadge": true,
                        "alertStyle": 1,
                        "status": 2,
                        "allowsPreviews": 1
                },
                "expires": "never",
                    "granted": true
            },
                "pushtokenObj": {
                "type": "expo",
                    "data": "ExponentPushToken[FrpOmOBYzB8XP8SyvOgjOC]"
                }
            }
        */
        let expoPushToken = pushTokenObj?.pushtokenObj?.data;

        if(expoPushToken === undefined) {
            //console.log("No push token for device: "+device.id);
            return;
        }

        let project_name = await this.getProjectName();

        let foodName = this.getFoodNameTranslation(foodWithTranslations, language);
        let translationDate = await this.getTranslationDate(language, aboutMealsInDays, date);
        let emojiFood = "🍽";
        let useEmoji = true;
        let message_body = translationDate+": "+foodName;
        if(useEmoji) {
            message_body = emojiFood+" "+message_body;
        }

        let expo_push_tokens = [expoPushToken];
        let pushNotificationObj = {
            status: "published",
            expo_push_tokens: expo_push_tokens,
            message_title: project_name,
            message_body: message_body,
        }

        try{
            let pushNotification = await pushNotificationService.createOne(pushNotificationObj);
        } catch (err) {
            //console.log("Error while creating push notification");
            //console.log(err);
            const message = err.message;
            if(message.includes("Failed to send notification")){
                //console.log("Failed to send notification");
                //console.log("We better reset on the device the pushTokenObj to null");
                // Reset the pushTokenObj to null
                let devicesService = await this.itemsServiceCreator.getItemsService(CollectionNames.DEVICES);
                await devicesService.updateOne(device.id, {pushTokenObj: null});
            }
        }
    }

    async getTranslationDate(profileLanguage, aboutMealsInDays, date) {
        if(aboutMealsInDays === 0) {
            return "Heute";
        } else if(aboutMealsInDays === 1) {
            return "Morgen";
        }

        // from date get TT.MM with date.getDate() and date.getMonth()
        return date.getDate() + "." + date.getMonth();
    }

    getFoodNameTranslation(foodWithTranslations, profileLanguage) {
        return this.getTranslation(foodWithTranslations?.translations, profileLanguage, "name") || "ein Gericht";
    }

    getTranslation(translationsList, profileLanguage, fieldName) {
        translationsList = translationsList || [];
        let translation = translationsList.find(t => t.languages_code === profileLanguage);
        let translationDefault = translationsList.find(t => t.languages_code === DefaultLanguage);
        let translationFallBack = translationsList.find(t => t.languages_code === FallBackLanguage);
        return translation?.[fieldName] || translationDefault?.[fieldName] || translationFallBack?.[fieldName]
    }

    async getProjectName() {
        let serverInfo = await this.serverServiceCreator.getServerInfo();
        let project = serverInfo?.project;
        let project_name = project?.project_name;
        return project_name || "Rocket Meals";
    }

    async getFoodWithTranslations(food_id) {
        let foodsService = await this.itemsServiceCreator.getItemsService(TABLENAME_MEALS);
        let food = await foodsService.readOne(food_id, {fields: ["*", "translations.*"]});
        return food;
    }

    async getProfileAndDevicesForProfile(profile_id) {
        let profileService = await this.itemsServiceCreator.getItemsService(CollectionNames.PROFILES);
        let profile = await profileService.readOne(profile_id, {fields: ["*", "devices.*"]});
        return profile;
    }

    async getFoodFeedbacksForFood(food_id) {
        let itemService = await this.itemsServiceCreator.getItemsService(TABLENAME_FOODS_FEEDBACKS)
        let foodFeedbacks = await itemService.readByQuery({filter: { // filter where food_id is food AND notify is true
                _and: [
                    {food: food_id},
                    {notify: true}
                ]
        },
            limit: -1});
        return foodFeedbacks;
    }


    async getFoodOffersForDate(date) {
        let startOfTheDay = new Date(date); // copy the date
        let endOfTheDay = new Date(date); // copy the date
        startOfTheDay.setHours(0,0,0,0); // so set the start at the beginning of the day
        endOfTheDay.setHours(23,59,59,999); //set to end of day

        let itemService = await this.itemsServiceCreator.getItemsService(TABLENAME_FOODOFFERS)
        let foodOffers = await itemService.readByQuery({filter: {
            date: {
                _between: [startOfTheDay.toISOString(), endOfTheDay.toISOString()]
            }
        },
            limit: -1});
        return foodOffers;
    }

}
