import {useSynchedProfile} from "./ProfileAPI";

const FIELD_BUILDINGS_ID = "buildings_id";
const FIELD_PROFILE_FAVORITE_BUILDINGS = "buildings_favorites";

export function useSynchedProfileBuildingsFavorite(resource_id: number): [profileBuildingFavorite: any, addFavorite: () => any, removeFavorite: () => any] {
    const [profilesBuildingsFavoritesDict, addProfileFavoriteBuilding, removeProfileFavoriteBuilding] = useSynchedProfileFavoriteBuildingsDict();
    let profileBuildingFavorite = profilesBuildingsFavoritesDict[resource_id];

    const addProfileFavoriteBuildingSingle = () => {
        addProfileFavoriteBuilding(resource_id);
    }

    const removeProfileFavoriteSingle = () => {
        removeProfileFavoriteBuilding(resource_id);
    }

    return [
        profileBuildingFavorite, addProfileFavoriteBuildingSingle, removeProfileFavoriteSingle
    ]
}

export function useSynchedProfileFavoriteBuildingsDict(): [value: {[key: string]: any}, addProfileFavoriteBuilding: (resource_id: number) => any, removeProfileFavoriteBuilding: (resource_id: number) => any] {
    const [profile, setProfile] = useSynchedProfile();
    // @ts-ignore
    let listOfFavoriteBuildings = profile?.[FIELD_PROFILE_FAVORITE_BUILDINGS] || [];

    let profilesBuildingsFavoritesDict = {};
    if(!!listOfFavoriteBuildings){
        for(let profile_building_favorite of listOfFavoriteBuildings){
            profilesBuildingsFavoritesDict[profile_building_favorite?.[FIELD_BUILDINGS_ID]] = profile_building_favorite;
        }
    }

    //TODO: this is a copy of the MarkingAPI.ts, refactor this
    const privateSetBuildingsFavorite = (resource_id: number, remove: boolean) => {
        //console.log("privateSetBuildingsFavorite", resource_id, remove);
        let dictCopy = JSON.parse(JSON.stringify(profilesBuildingsFavoritesDict));
        //console.log("dictCopy", dictCopy);
        dictCopy[resource_id] = {[FIELD_BUILDINGS_ID]: resource_id, profiles_id: profile?.id};
        if(remove){
            //console.log("remove", resource_id);
            delete dictCopy[resource_id];
        }
        //console.log("dictCopy", dictCopy);

        let resourceIds = Object.keys(dictCopy);
        let newResources = [];
        for(let resourceId of resourceIds){
            newResources.push(dictCopy[resourceId]);
        }
        console.log("privateSetBuildingsFavorite", newResources);
        // @ts-ignore
        profile[FIELD_PROFILE_FAVORITE_BUILDINGS] = newResources;
        setProfile(profile);
    }

    const addProfileFavoriteBuilding = (resource_id: number) => {
        privateSetBuildingsFavorite(resource_id, false);
    }

    const removeProfileFavoriteBuilding = (resource_id: number) => {
        privateSetBuildingsFavorite(resource_id, true);
    }

    return [
        profilesBuildingsFavoritesDict, addProfileFavoriteBuilding, removeProfileFavoriteBuilding
    ]
}
