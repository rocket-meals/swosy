import {useSynchedProfile} from "./ProfileAPI";

const FIELD_BUILDINGS_ID = "buildings_id";
const FIELD_LAST_VISITED = "last_visited";
const FIELD_PROFILE_BUILDINGS_LAST_VISITED = "buildings_last_visited";

export function getLastVisitedDateFromDictEntry(dictEntry){
    let profileBuildingLastVisited = dictEntry?.[FIELD_LAST_VISITED];
    if(!!profileBuildingLastVisited) {
        profileBuildingLastVisited = new Date(profileBuildingLastVisited);
    }
    return profileBuildingLastVisited;
}

export function useSynchedProfileBuildingsLastVisited(resource_id: number): [profileBuildingFavorite: any, addFavorite: () => any, removeFavorite: () => any] {
    const [profilesBuildingsLastVisitedDict, updateProfileBuildingLastVisited, removeProfileBuildingLastVisited] = useSynchedProfileBuildingsLastVisitedDict();
    let profileBuildingLastVisited = getLastVisitedDateFromDictEntry(profilesBuildingsLastVisitedDict?.[resource_id]);

    const updateProfileBuildingLastVisitedSingle = () => {
        updateProfileBuildingLastVisited(resource_id);
    }

    const removeProfileBuildingLastVisitedSingle = () => {
        removeProfileBuildingLastVisited(resource_id);
    }

    return [
        profileBuildingLastVisited, updateProfileBuildingLastVisitedSingle, removeProfileBuildingLastVisitedSingle
    ]
}

export function useSynchedProfileBuildingsLastVisitedDict(): [value: {[key: string]: any}, addProfileFavoriteBuilding: (resource_id: number) => any, removeProfileFavoriteBuilding: (resource_id: number) => any, getProfileBuildingsLastVisitedDateFromBuildingId: (resource_id: number) => any] {
    const [profile, setProfile] = useSynchedProfile();
    // @ts-ignore
    let listOfFavoriteBuildings = profile?.[FIELD_PROFILE_BUILDINGS_LAST_VISITED] || [];
    console.log("listOfFavoriteBuildings", listOfFavoriteBuildings);

    let profilesBuildingsLastVisitedDict = {};
    if(!!listOfFavoriteBuildings){
        for(let profile_building_favorite of listOfFavoriteBuildings){
            profilesBuildingsLastVisitedDict[profile_building_favorite?.[FIELD_BUILDINGS_ID]] = profile_building_favorite;
        }
    }

    //TODO: this is a copy of the MarkingAPI.ts, refactor this, Check for inner TODO
    const privateSetBuildingsLastVisited = (resource_id: number, remove: boolean) => {
        console.log("privateSetBuildingsLastVisited: "+resource_id);
        if(!resource_id){ //TODO: Add secure check
            return;
        }

        //console.log("privateSetBuildingsFavorite", resource_id, remove);
        let dictCopy = JSON.parse(JSON.stringify(profilesBuildingsLastVisitedDict));
        //console.log("dictCopy", dictCopy);
        let relation_entry = {
            [FIELD_BUILDINGS_ID]: resource_id,
            profiles_id: profile?.id,
            [FIELD_LAST_VISITED]: new Date().toISOString()
        }
        if(!!dictCopy[resource_id]?.id){
            //@ts-ignore
            relation_entry.id = dictCopy[resource_id].id;
        }
        dictCopy[resource_id] = relation_entry;
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
        profile[FIELD_PROFILE_BUILDINGS_LAST_VISITED] = newResources;
        setProfile(profile);
    }

    const updateProfileLastVisitedBuilding = (resource_id: number) => {
        console.log("updateProfileLastVisitedBuilding");
        privateSetBuildingsLastVisited(resource_id, false);
    }

    const removeProfileLastVisitedBuilding = (resource_id: number) => {
        privateSetBuildingsLastVisited(resource_id, true);
    }

    const getProfileBuildingsLastVisitedDateFromBuildingId = (resource_id) => {
        return getLastVisitedDateFromDictEntry(profilesBuildingsLastVisitedDict?.[resource_id]);
    }

    return [
        profilesBuildingsLastVisitedDict, updateProfileLastVisitedBuilding, removeProfileLastVisitedBuilding, getProfileBuildingsLastVisitedDateFromBuildingId
    ]
}
