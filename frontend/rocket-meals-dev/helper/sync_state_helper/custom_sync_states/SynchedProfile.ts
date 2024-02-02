import {PersistentStore} from "@/helper/sync_state_helper/PersistentStore";
import {
    Canteens, CanteensBusinesshours, Devices,
    DirectusUsers, Foods, FoodsFeedbacks,
    Profiles,
    ProfilesBuildingsFavorites, ProfilesBuildingsLastVisited, ProfilesMarkings
} from "@/helper/database_helper/databaseTypes/types";
import {useSynchedResourceSingleRaw} from "@/helper/sync_state_helper/custom_sync_states/SynchedResource";
import {useIsDemo} from "@/helper/sync_state_helper/custom_sync_states/SynchedDemo";
import {ServerAPI} from "@/helper/database_helper/server/ServerAPI";
import {CollectionHelper} from "@/helper/database_helper/server/CollectionHelper";

export async function loadProfileRemote(user: DirectusUsers | undefined) {
    if(!!user){
        const profileRelations = ["markings", "foods_feedbacks", "devices", "buildings_favorites", "buildings_last_visited"]
        const profileFields = ["*"];
        for(let relation of profileRelations) {
            profileFields.push(relation+".*");
        }

        const deepFields: Record<string, { _limit: number }> = {};
        for(let relation of profileRelations) {
            deepFields[relation] = { _limit: -1 };
        }

        let usersProfileId = user.profile
        if(usersProfileId){
            const profileCollectionHelper = new CollectionHelper<Profiles>("profiles")
            let profile = await profileCollectionHelper.readItem(usersProfileId, {
                fields: profileFields,
                deep: deepFields,
            })
            return profile;
        }
    }
    return undefined;
}

export function useSynchedProfile(): [(Profiles | undefined), ((newValue: Profiles, timestampe?: number) => void), (number | undefined)] {
  const [resourceOnly, setResource, resourceRaw, setResourceRaw] = useSynchedResourceSingleRaw<Profiles>(PersistentStore.profile);
    let lastUpdate = resourceRaw?.lastUpdate;
  const demo = useIsDemo()
    let usedResource = resourceOnly;
    if(demo) {
        usedResource = getDemoResource()
    }
    return [usedResource, setResource, lastUpdate]
}

function getDemoResource(): Profiles {

    const undefinedBuildingsFavorites = undefined as any as string & ProfilesBuildingsFavorites[];
    const undefinedBuildingsLastVisited = undefined as any as string & ProfilesBuildingsLastVisited[];
    const undefinedDevices = undefined as any as string & Devices[];
    const undefinedFoodsFeedbacks = undefined as any as string & FoodsFeedbacks[];
    const undefinedMarkings = undefined as any as string & ProfilesMarkings[];

  let demoResource: Profiles = {
      //avatar?: unknown;
      //canteen?: undefined
      //course_timetable?: unknown;
      credit_balance: 12.34,
      date_created: new Date().toISOString(),
      date_updated: new Date().toISOString(),
      id: 123,
      //language?: string;
      nickname: "Demo User",
      //sort?: number;
      status: "",
      //user_created?: string & DirectusUsers;
      //user_updated?: string & DirectusUsers;
      buildings_favorites: undefinedBuildingsFavorites,
      buildings_last_visited: undefinedBuildingsLastVisited,
      devices: undefinedDevices,
      foods_feedbacks: undefinedFoodsFeedbacks,
      markings: undefinedMarkings,
  }

  return demoResource
}

export function getEmptyProfile(): Profiles{
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
        id: 0,
        markings: undefinedMarkings,
        status: "",
        nickname: "Demo User"
    }
}