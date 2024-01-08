import React from "react";
import {Icon} from "../../../kitcheningredients";
import {useClipboard, useToast, View} from "native-base";
import {useSynchedBuilding} from "../../helper/synchedJSONState";
import {AppTranslation, useAppTranslation} from "../../components/translations/AppTranslation";
import {InfoIcon} from "../icons/InfoIcon";
import {SettingsRow} from "../settings/SettingsRow";
import {ShowLocationIcon} from "../icons/ShowLocationIcon";
import {CopyIcon} from "../icons/CopyIcon";
import {MyClipboard} from "../../helper/MyClipboard";
import {BuildingHelper} from "./BuildingHelper";
import {DebugIcon} from "../icons/DebugIcon";

export function BuildingsContentActionMenuBuildingInformation(resource_id, additionalInformation?){
	const resource = useSynchedBuilding(resource_id);

	const translation_openNavigationToLocation = useAppTranslation("openNavigationToLocation");
	const translation_coordinates = useAppTranslation("coordinates");
	const translation_openURL = useAppTranslation("openURL")
	const translation_copy = useAppTranslation("copy")
	const translation_yearOfConstruction = useAppTranslation("yearOfConstruction");
	const translation_unknown = useAppTranslation("unknown");

	const yearOfConstructionAsString = getYearOfConstructionAsString();

	const toast = useToast();
	const clipboard = useClipboard();

	const location = BuildingHelper.getBuildingLocation(resource);
	const hasLocation = !!location?.latitude && location?.longitude;
	const locationAsString = getLocationAsString(location);

	function getLocationAsString(location){
		return location?.latitude + ", " + location?.longitude;
	}

	function getYearOfConstructionAsString(){
		const year_of_construction = resource?.year_of_construction || translation_unknown;

		return year_of_construction
	}

	function renderBuildingInformation(){
		if(!resource){
			return null;
		} else {
			let routeInformations = null;
			if(hasLocation){
				routeInformations = (
					<>
						<SettingsRow
							accessibilityLabel={translation_openNavigationToLocation}
							leftIcon={<ShowLocationIcon/>}
							leftContent={translation_openNavigationToLocation}
							onPress={() => {
								BuildingHelper.openLocation(resource);
							}}
						/>
						<SettingsRow
							accessibilityLabel={translation_copy+": "+translation_coordinates}
							leftIcon={<ShowLocationIcon/>}
							leftContent={translation_coordinates}
							rightContent={locationAsString}
							rightIcon={<CopyIcon />}
							onPress={async () => {
								await MyClipboard.copyText(toast, clipboard, getLocationAsString());
							}}
						/>
					</>
				)
			}


			return(
				<>
					{routeInformations}
					<SettingsRow
						accessibilityLabel={translation_openURL}
						leftIcon={<Icon name={"web"}/>}
						leftContent={translation_openURL}
						rightContent={BuildingHelper.getBuildingUrl(resource)}
						onPress={() => {
							BuildingHelper.openURL(resource);
						}}
					/>
					<SettingsRow
						accessibilityLabel={translation_yearOfConstruction+": "+yearOfConstructionAsString}
						leftIcon={<Icon name={"hard-hat"}/>}
						leftContent={translation_yearOfConstruction}
						rightContent={yearOfConstructionAsString}
					/>

				</>
			)
		}
	}

	function renderInformation(){
		return <View>
			{additionalInformation}
			{renderBuildingInformation()}
		</View>
	}

	return {
		element: renderInformation(),
		renderIcon: (backgroundColor, textColor) => {return <InfoIcon color={textColor} />},
		renderContent: (backgroundColor, textColor) => {return <AppTranslation color={textColor} id={"information"} />},
	}
}
