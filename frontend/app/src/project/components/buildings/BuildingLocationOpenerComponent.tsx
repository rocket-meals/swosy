import React, {FunctionComponent} from "react";
import {useSynchedBuilding, useSynchedBuildingsDict} from "../../helper/synchedJSONState";
import {BuildingHelper} from "./BuildingHelper";
import {LocationOpenerComponent} from "../../helper/geo/LocationOpenerComponent";
import {useAppTranslation} from "../translations/AppTranslation";

interface AppState {
	resource_id: any,
	small?: boolean,
}
export const BuildingLocationOpenerComponent: FunctionComponent<AppState> = (props) => {

	const resource_id = props?.resource_id;
	const building = useSynchedBuilding(resource_id);
	const location = BuildingHelper.getBuildingLocation(building);
	const accessibilityHint = useAppTranslation("openLocationInMaps");

	return (
		<LocationOpenerComponent location={location} accessibilityLabel={accessibilityHint}>
			{props.children}
		</LocationOpenerComponent>
	)

}
