import {useSynchedProfileCanteen} from "../../components/profile/ProfileAPI";
import {useSynchedBuilding, useSynchedCanteen} from "../synchedJSONState";
import {BuildingHelper} from "../../components/buildings/BuildingHelper";
import {LocationType} from "../geo/LocationType";

export function useNearestLocation(): LocationType {
    const [profileCanteenId, setProfileCanteenId] = useSynchedProfileCanteen();

    const profiles_canteen = useSynchedCanteen(profileCanteenId);
    const canteens_building_id = profiles_canteen?.building;
    const canteens_building = useSynchedBuilding(canteens_building_id);

    return BuildingHelper.getBuildingLocation(canteens_building);
}
