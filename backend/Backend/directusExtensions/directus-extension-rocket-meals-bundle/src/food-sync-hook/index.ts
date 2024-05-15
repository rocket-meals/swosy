import {ParseSchedule} from "./ParseSchedule"; 
import {defineHook} from "@directus/extensions-sdk";
import {CollectionNames} from "../helpers/CollectionNames";
import {DatabaseInitializedCheck} from "../helpers/DatabaseInitializedCheck";
import {ParserInterface} from "./ParserInterface";
import {TL1Parser} from "./TL1Parser";
import {TL1Parser_RawReportFtpReader} from "./TL1Parser_RawReportFtpReader";
import {TL1Parser_RawReportUrlReader} from "./TL1Parser_RawReportUrlReader";
import {SWOSY_API_Parser} from "./SWOSY_API_Parser";
import {FileServiceCreator, ItemsServiceCreator} from "../helpers/ItemsServiceCreator";

const SCHEDULE_NAME = "food_parse";

function getParser(env: any): ParserInterface | null {
    const FOOD_SYNC_MODE = env.FOOD_SYNC_MODE; // Options: "TL1CSV", "TL1WEB", "SWOSY"

    switch (FOOD_SYNC_MODE) {
        case "TL1CSV":
            /* TL1 CSV FILE */
            const FOOD_SYNC_TL1FILE_EXPORT_CSV_FILE_PATH = env.FOOD_SYNC_TL1FILE_EXPORT_CSV_FILE_PATH;
            const FOOD_SYNC_TL1FILE_EXPORT_CSV_FILE_ENCODING = env.FOOD_SYNC_TL1FILE_EXPORT_CSV_FILE_ENCODING || "latin1";

            console.log(SCHEDULE_NAME + ": Using TL1 CSV file from host file path: " + FOOD_SYNC_TL1FILE_EXPORT_CSV_FILE_PATH);
            const tl1_csv_file_path = "/directus/tl1/foodPlan.csv";
            const ftpFileReader = new TL1Parser_RawReportFtpReader(tl1_csv_file_path, FOOD_SYNC_TL1FILE_EXPORT_CSV_FILE_ENCODING);
            // @ts-ignore // this should be fine, because the class implements the interface // TODO: Investigate why this is necessary
            return new TL1Parser(ftpFileReader);
        case "TL1WEB":
            /* TL1 URL */
            const FOOD_SYNC_TL1WEB_EXPORT_URL = env.FOOD_SYNC_TL1WEB_EXPORT_URL;
            if(!FOOD_SYNC_TL1WEB_EXPORT_URL) {
                console.log(SCHEDULE_NAME + ": no URL configured for TL1WEB");
                return null;
            }

            console.log(SCHEDULE_NAME + ": Using TL1 CSV file from URL: " + FOOD_SYNC_TL1WEB_EXPORT_URL);
            const urlReader = new TL1Parser_RawReportUrlReader(FOOD_SYNC_TL1WEB_EXPORT_URL);
            // @ts-ignore // this should be fine, because the class implements the interface // TODO: Investigate why this is necessary
            return new TL1Parser(urlReader);
        case "SWOSY":
            /* SWOSY API */
            const FOOD_SYNC_SWOSY_API_SERVER_URL = env.FOOD_SYNC_SWOSY_API_SERVER_URL;
            if(!FOOD_SYNC_SWOSY_API_SERVER_URL) {
                console.log(SCHEDULE_NAME + ": no URL configured for SWOSY API");
                return null;
            }

            console.log(SCHEDULE_NAME + ": Using SWOSY API: " + FOOD_SYNC_SWOSY_API_SERVER_URL);
            // @ts-ignore // this should be fine, because the class implements the interface // TODO: Investigate why this is necessary
            return new SWOSY_API_Parser(FOOD_SYNC_SWOSY_API_SERVER_URL);
    }

    return null;
}

async function checkForImageSynchronize(env: any, services: any, database: any, schema: any){
    //console.log(SCHEDULE_NAME + ": Checking for image synchronize");
    const FOOD_IMAGE_SYNC_ON_STARTUP_FROM_SWOSY = env.FOOD_IMAGE_SYNC_ON_STARTUP_FROM_SWOSY;
    const FOOD_SYNC_SWOSY_API_SERVER_URL = env.FOOD_SYNC_SWOSY_API_SERVER_URL;

    const itemsServiceCreator = new ItemsServiceCreator(services, database, schema);
    const fileServiceCreator = new FileServiceCreator(services, database, schema);

    const canImportImages = FOOD_IMAGE_SYNC_ON_STARTUP_FROM_SWOSY && FOOD_SYNC_SWOSY_API_SERVER_URL;
    if(canImportImages){


        console.log(SCHEDULE_NAME + ": Importing images from a SWOSY API: " + FOOD_SYNC_SWOSY_API_SERVER_URL);
        const foodsService = itemsServiceCreator.getItemsService(CollectionNames.FOODS);
        const meals = await foodsService.readByQuery({
            limit: -1
        });


        let amountMeals = meals.length;
        let amountMealsImagesImported = 0;
        let amountMealsWithoutImage = 0;
        let amountProcessed = 0;

        console.log(SCHEDULE_NAME + ": Found " + meals.length + " meals");
        for(const meal of meals) {
            if (!meal.image) {
                amountMealsWithoutImage++;
            }
        }


        for(const meal of meals) {
            amountProcessed++;
            const meal_id = meal.id;

            if (meal.image) {
                //console.log(SCHEDULE_NAME + ": Meal " + meal_id + " already has an image");
            } else {
                //console.log(SCHEDULE_NAME + ": Meal " + meal_id + " has no image");
                const swosyImageUrl = SWOSY_API_Parser.getImageRemoteUrlForMealId(FOOD_SYNC_SWOSY_API_SERVER_URL, meal.id);
                if(swosyImageUrl) {
                    //console.log(SCHEDULE_NAME + ": Trying to import image for meal " + meal_id + " from " + swosyImageUrl);

                    //https://github.com/directus/directus/blob/main/api/src/services/files.ts
                    const optionalFileParams: Partial<File> = {
                        // @ts-ignore
                        filename_download: meal_id + ".jpg",
                        title: meal_id
                    }

                    try{
                        let file_id = await fileServiceCreator.importByUrl(swosyImageUrl, optionalFileParams);
                        if(file_id) {
                            //console.log(SCHEDULE_NAME + ": Imported image for meal " + meal_id + " with file id " + file_id);
                            await foodsService.updateOne(meal_id, {
                                image: file_id
                            });
                            amountMealsImagesImported++;
                        } else {
                            console.log(SCHEDULE_NAME + ": Unknown Error while importing image for meal " + meal_id);
                        }
                    } catch (err: any) {
                        if(err.toString().includes("Couldn't fetch file from URL")){
                            //console.log(SCHEDULE_NAME + ": File for " + meal_id+ " does not exist at " + swosyImageUrl);
                        } else {
                            console.log(err.toString());
                            console.log(SCHEDULE_NAME + ": Error while importing image for meal " + meal_id);
                            console.log(err);
                        }
                    }

                }
            }

            console.log(SCHEDULE_NAME + ": Processed: " + amountProcessed + "/" + amountMeals+" || Meals without image: " + amountMealsWithoutImage + " | Meals with imported image: " + amountMealsImagesImported);
        }
    }
}

export default defineHook(async ({action}, {
    services,
    database,
    env,
    getSchema,
    logger
}) => {
    let allTablesExist = await DatabaseInitializedCheck.checkAllTablesExist(SCHEDULE_NAME,getSchema);
    if (!allTablesExist) {
        return;
    }

    const usedParser = getParser(env);

    if(!usedParser) {
        console.log(SCHEDULE_NAME + ": no food parser configured");
        console.log(SCHEDULE_NAME + ": please configure a food parser in the .env file and restart the server");
        return;
    }

    const parseSchedule = new ParseSchedule(usedParser);

    let collection = CollectionNames.APP_SETTINGS

    await parseSchedule.init(getSchema, services, database, logger);

    action(
        collection + ".items.update",
        async () => {
            //TODO check if field "parse_foods" is active
            try {
                await parseSchedule.parse(false);
            } catch (err) {
                console.log(err);
            }
            //TODO set field "parse_foods" to false
        }
    );

    try{
        const schema = await getSchema();
        await checkForImageSynchronize(env, services, database, schema);
    } catch (err) {
        console.log("Error while checking for image synchronize");
        console.log(err);
    }
});