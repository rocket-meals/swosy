import {PersistentStore} from "@/helper/syncState/PersistentStore";
import {
    Canteens,
    Devices,
    DirectusUsers,
    FoodsFeedbacks, Markings,
    Profiles,
    ProfilesBuildingsFavorites,
    ProfilesBuildingsLastVisited,
    ProfilesMarkings
} from "@/helper/database/databaseTypes/types";
import {useSynchedResourceSingleRaw} from "@/states/SynchedResource";
import {CollectionHelper} from "@/helper/database/server/CollectionHelper";
import {useSynchedCanteensDict} from "@/states/SynchedCanteens";
import {useIsCurrentUserAnonymous} from "@/states/User";
import {useIsServerOnline} from "@/states/SyncStateServerInfo";
import {DirectusTranslationHelper} from "@/helper/translations/DirectusTranslationHelper";

async function loadProfileRemoteByProfileId(id: string) {
    const profileRelations = ["markings", "foods_feedbacks", "devices", "buildings_favorites", "buildings_last_visited"]
    const profileFields = profileRelations.map(x => x+".*").concat(["*"]);

    const deepFields: Record<string, { _limit: number }> = profileRelations.reduce((acc, x) => {
        acc[x] = { _limit: -1 };
        return acc;
    }, {} as Record<string, { _limit: number }>);

    let usersProfileId: string = id;
    console.log("usersProfileId: ",usersProfileId)
    console.log("Okay lets load from remote")
    const profileCollectionHelper = new CollectionHelper<Profiles>("profiles")
    return await profileCollectionHelper.readItem(usersProfileId, {
        fields: profileFields,
        deep: deepFields,
    });
}

export async function deleteProfileRemote(id: string | number){
    const profileCollectionHelper = new CollectionHelper<Profiles>("profiles")
    await profileCollectionHelper.deleteItem(id);

}

export async function loadProfileRemoteByUser(user: DirectusUsers | undefined) {
    console.log("loadProfileRemote");
    console.log("user", user)
    if(!!user){
        let usersProfileId: string = user.profile as unknown as string
        console.log("usersProfileId: ",usersProfileId)
        if (usersProfileId){
            return await loadProfileRemoteByProfileId(usersProfileId);
        }
    }
    return undefined;
}

export async function updateProfileRemote(id: string | number, profile: Partial<Profiles>){
    console.log("updateProfileRemote")
    console.log("id: ", id)
    console.log("profile: ", profile)
    const profileCollectionHelper = new CollectionHelper<Profiles>("profiles")
    await profileCollectionHelper.updateItem(id, profile);
    return await loadProfileRemoteByProfileId(id as string);
}

export function useSynchedProfile(): [(Partial<Profiles>), ((newValue: Partial<Profiles>, timestamp?: number) => Promise<(boolean | void)>), (number | undefined)] {
    const [resourceOnly, setResource, resourceRaw, setResourceRaw] = useSynchedResourceSingleRaw<Partial<Profiles>>(PersistentStore.profile);
    const isServerOnline = useIsServerOnline()
    const isCurrentUserAnonymous = useIsCurrentUserAnonymous();

    let lastUpdate = resourceRaw?.lastUpdate;
    let usedSetResource: (newValue: Partial<Profiles>, timestamp?: number) => Promise<(boolean | void)> = async (newValue, timestamp) => {
        return setResource(newValue, timestamp);
    };
    if(isServerOnline && !isCurrentUserAnonymous){
        usedSetResource = async (newValue: Partial<Profiles>, timestamp?: number) => {
            console.log("useSynchedProfile setProfile online");
            const profile_id = newValue?.id || resourceOnly?.id;
            console.log("profile_id: ", profile_id)
            if (!!profile_id) {
                try {
                    let remoteAnswer = await updateProfileRemote(profile_id, newValue);
                    console.log("remoteAnswer: ", remoteAnswer)
                    setResource(newValue, timestamp);
                    return true;
                } catch (err) {
                    console.log(err)
                    return false;
                }
            } else {
                setResource(newValue, timestamp);
                return true;
            }
        }
    }
    let usedResource = resourceOnly;
    if(!usedResource){
        usedResource = {}
    }
    return [usedResource, usedSetResource, lastUpdate]
}

export enum PriceGroups {
    Student = "student",
    Employee = "employee",
    Guest = "guest"
}
export function useProfilePriceGroup(): [PriceGroups, ((newValue: string) => void)]{
    const [profile, setProfile] = useSynchedProfile();
    const setPriceGroup = (priceGroup: string) => {
        profile.price_group = priceGroup;
        return setProfile(profile);
    }

    let usedPriceGroup = PriceGroups.Student;
    let profilePriceGroup = profile?.price_group;
    if(!!profilePriceGroup){
        // check if profilePriceGroup is a valid PriceGroup
        if(profilePriceGroup === PriceGroups.Student || profilePriceGroup === PriceGroups.Employee || profilePriceGroup === PriceGroups.Guest){
            usedPriceGroup = profilePriceGroup;
        }
    }


    return [usedPriceGroup, setPriceGroup];

}

export function useNickname(): [string | null | undefined, ((newValue: string | undefined) => Promise<boolean | void>)]{
    const [profile, setProfile, lastUpdateProfile] = useSynchedProfile()
    async function setNickname(nextValue: string | undefined){
        console.log("SettingsRowProfileNickname onSave", nextValue)
        return await setProfile({...profile, nickname: nextValue})
    }
    const nickname = profile?.nickname
    return [nickname, setNickname]
}

export function useProfileLanguageCode(): [string, ((newValue: string) => void)]{
    const [profile, setProfile] = useSynchedProfile();
    const setLanguage = (language: string) => {
        profile.language = language;
        return setProfile(profile);
    }
    let usedLanguage: string = DirectusTranslationHelper.DEFAULT_LANGUAGE_CODE_GERMAN;
    let profileLanguage = profile?.language;
    if(!!profileLanguage){
        if(typeof profileLanguage !== "string"){
            usedLanguage = profileLanguage.code
        } else {
            usedLanguage = profileLanguage;
        }
    }

    return [usedLanguage, setLanguage];
}

export function useProfileLocaleForJsDate(): string {
    const [language, setLanguage] = useProfileLanguageCode();
    let locale = language;
    if(!!locale){
        locale = locale.toLowerCase() //"en-US" --> "en-us"; since js uses lowercase
    }
    // TODO: check if locale is valid as ISO 639-1 code or something like that
    return locale;
}

export function useSynchedProfileCanteen(): [Canteens | undefined, ((newValue: Canteens) => void)]{
    const [profile, setProfile] = useSynchedProfile();
    const [canteenDict, setCanteenDict] = useSynchedCanteensDict();

    let canteen_id = profile?.canteen as string;
    let canteen = undefined
    if(canteenDict && canteen_id){
        canteen = canteenDict[canteen_id];
    }

    const setCanteen = (canteen: Canteens) => {
        profile.canteen = canteen.id;
        return setProfile(profile);
    }
    return [canteen, setCanteen];
}

export function useIsProfileSetupComplete(): boolean {
    const [profileCanteen, setProfileCanteen] = useSynchedProfileCanteen(); // We do not need a canteen to be set
    // we should check if the user is first time user and has not set any data

    const requiredSetVariables: any[] = []
    for(let i=0; i<requiredSetVariables.length; i++){
        let requiredVariable = requiredSetVariables[i];
        if(!requiredVariable){
            return false;
        }
    }

    return true;
}


export function useSynchedProfileFoodFeedbacksDict(): [Record<string, FoodsFeedbacks>, ((food_id: string) => (FoodsFeedbacks | undefined)), ((food_id: string, rating: (number | null)) => Promise<boolean | void>), ((food_id: string, notify: (boolean | null)) => Promise<boolean | void>), ((food_id: string, comment: (string | null)) => Promise<boolean | void>)]
{
    const [profile, setProfile] = useSynchedProfile();
    let profileFoodFeedbacksList: FoodsFeedbacks[] = profile?.foods_feedbacks || [];

    let profilesFoodIdToFoodFeedbacksDict: Record<string, FoodsFeedbacks> = {};
    for(let i=0; i<profileFoodFeedbacksList.length; i++){
        let profilesFoodFeedback: FoodsFeedbacks = profileFoodFeedbacksList[i];
        let food_id = profilesFoodFeedback.food;
        if(!!food_id && typeof food_id === "string"){
            profilesFoodIdToFoodFeedbacksDict[food_id] = profilesFoodFeedback;
        }
    }

    const useOwnFoodFeedback = (food_id: string): FoodsFeedbacks | undefined => {
        return profilesFoodIdToFoodFeedbacksDict[food_id];
    }

    const setFoodFeedback = async (food_id: string, rating: number | null |undefined, notify: boolean | undefined | null, comment: string | null| undefined) => {
        let foodFeedbacksDictCopy = JSON.parse(JSON.stringify(profilesFoodIdToFoodFeedbacksDict))
        let existingFoodFeedback = foodFeedbacksDictCopy[food_id];
        if(!existingFoodFeedback) {
            existingFoodFeedback = {
                food: food_id,
                profile: profile.id
            }
        }

        if(rating !== undefined){
            existingFoodFeedback.rating = rating;
        } else if(notify !== undefined){
            existingFoodFeedback.notify = notify;
        } else if(comment !== undefined){
            existingFoodFeedback.comment = comment;
        }

        const ratingIsNull = existingFoodFeedback.rating === null || existingFoodFeedback.rating === undefined;
        const notifyIsNull = existingFoodFeedback.notify === null || existingFoodFeedback.notify === false || existingFoodFeedback.notify === undefined;
        const commentIsNull = existingFoodFeedback.comment === null || existingFoodFeedback.comment === undefined || existingFoodFeedback.comment === "";
        const shouldRemove = ratingIsNull && notifyIsNull && commentIsNull;

        if(shouldRemove){
            delete foodFeedbacksDictCopy[food_id];
        } else {
            foodFeedbacksDictCopy[food_id] = existingFoodFeedback;
        }

        let newFoodFeedbacks: FoodsFeedbacks[] = [];
        let foodIds = Object.keys(foodFeedbacksDictCopy);
        for(let foodId of foodIds) {
            newFoodFeedbacks.push(foodFeedbacksDictCopy[foodId]);
        }
        profile.foods_feedbacks = newFoodFeedbacks;
        return await setProfile(profile);
    }

    const setOwnFoodRating = async (food_id: string, rating: number | null) => {
        return await setFoodFeedback(food_id, rating, undefined, undefined);
    }

    const setOwnFoodNotify = async (food_id: string, notify: boolean | null) => {
        return await setFoodFeedback(food_id, undefined, notify, undefined);
    }

    const setOwnFoodFeedbackComment = async (food_id: string, comment: string | null) => {
        return await setFoodFeedback(food_id, undefined, undefined, comment);
    }

    return [profilesFoodIdToFoodFeedbacksDict, useOwnFoodFeedback, setOwnFoodRating, setOwnFoodNotify, setOwnFoodFeedbackComment];
}

export function useSynchedProfileFoodFeedback(food_id: string): [FoodsFeedbacks | undefined, ((rating: number | null) => Promise<boolean | void>), ((notify: boolean | null) => Promise<boolean | void>), ((comment: string | null) => Promise<boolean | void>)]{
    const [profilesFoodIdToFoodFeedbacksDict, useOwnFoodFeedback, setOwnFoodRating, setOwnFoodNotify, setOwnFoodFeedbackComment] = useSynchedProfileFoodFeedbacksDict();
    const foodFeedback = useOwnFoodFeedback(food_id);


    const setRating = async (rating: number | null) => {
        return await setOwnFoodRating(food_id, rating);
    }
    const setNotify = async (notify: boolean | null) => {
        return await setOwnFoodNotify(food_id, notify);
    }
    const setComment = async (comment: string | null) => {
        return await setOwnFoodFeedbackComment(food_id, comment);
    }
    return [foodFeedback, setRating, setNotify, setComment];
}

export function useSynchedProfileMarkingsDict(): [Record<string, ProfilesMarkings>, (marking: Markings, dislikes: boolean) => void, (marking: Markings) => void]{
    const [profile, setProfile] = useSynchedProfile();
    let profileMarkingsList: ProfilesMarkings[] = profile?.markings || [];
    let profilesMarkingsDict: Record<string, ProfilesMarkings> = {};
    for(let i=0; i<profileMarkingsList.length; i++){
        let profilesMarking = profileMarkingsList[i];
        let markings_key = profilesMarking.markings_id;
        if(!!markings_key && typeof profilesMarking.markings_id === "string"){
            profilesMarkingsDict[profilesMarking.markings_id] = profilesMarking;
        }
    }

    const privateSetMarkings = (marking: Markings, dislikes: boolean, remove: boolean) => {
        let markingsDictCopy = JSON.parse(JSON.stringify(profilesMarkingsDict));

        let newProfileMarking: Partial<ProfilesMarkings> = {
            markings_id: marking.id,
            profiles_id: profile?.id,
            dislikes: dislikes
        };
        markingsDictCopy[marking.id] = newProfileMarking;

        if(remove){
            delete markingsDictCopy[marking.id];
        }

        let markingsIds = Object.keys(markingsDictCopy);
        let newMarkings: ProfilesMarkings[] = [];
        for(let markingId of markingsIds){
            newMarkings.push(markingsDictCopy[markingId]);
        }

        profile.markings = newMarkings;
        setProfile(profile);
    }

    const setProfileMarking = (marking: Markings, dislikes: boolean) => {
        privateSetMarkings(marking, dislikes, false);
    }

    const removeProfileMarking = (marking: Markings) => {
        privateSetMarkings(marking, false, true);
    }


    return [profilesMarkingsDict, setProfileMarking, removeProfileMarking];
}

export function getEmptyProfile(): Partial<Profiles>{
    const undefinedBuildingsFavorites = undefined as any as string & ProfilesBuildingsFavorites[];
    const undefinedBuildingsLastVisited = undefined as any as string & ProfilesBuildingsLastVisited[];
    const undefinedDevices = undefined as any as string & Devices[];
    const undefinedFoodsFeedbacks = undefined as any as string & FoodsFeedbacks[];
    const undefinedMarkings = undefined as any as string & ProfilesMarkings[];

    return {
        buildings_favorites: undefinedBuildingsFavorites,
        buildings_last_visited: undefinedBuildingsLastVisited,
        devices: undefinedDevices,
        foods_feedbacks: undefinedFoodsFeedbacks,
        canteen: undefined,
        markings: undefinedMarkings,
        nickname: "Gast"
    }
}