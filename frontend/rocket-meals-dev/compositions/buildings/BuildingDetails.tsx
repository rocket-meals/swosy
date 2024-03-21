import {Buildings} from '@/helper/database/databaseTypes/types';
import React from 'react';
import {IconNames} from '@/constants/IconNames';
import {useSynchedBuildingsDict} from "@/states/SynchedBuildings";
import {DirectusTranslatedMarkdown} from "@/components/markdown/DirectusTranslatedMarkdown";
import {TranslationEntry} from "@/helper/translations/DirectusTranslationUseFunction";
import {DetailsComponent, DetailsComponentTabProps} from "@/components/detailsComponent/DetailsComponent";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {SettingsRowUser} from "@/compositions/settings/SettingsRowUser";
import {SettingsRowProfileNickname} from "@/compositions/settings/SettingsRowProfileNickname";
import {SettingsRowProfileLanguage} from "@/compositions/settings/SettingsRowProfileLanguage";
import {SettingsRowProfileCanteen} from "@/compositions/settings/SettingsRowProfileCanteen";
import {SettingsRowProfileEatingHabits} from "@/compositions/settings/SettingsRowEatingHabits";
import {SettingsRowPriceGroup} from "@/compositions/settings/SettingsRowPriceGroup";
import {SettingsRowGroup} from "@/components/settings/SettingsRowGroup";
import {SettingsRow} from "@/components/settings/SettingsRow";
import {useMyClipboard} from "@/helper/clipboardHelper/MyClipboardHelper";
import {CoordinateHelper} from "@/helper/geo/CoordinateHelper";
import {CommonSystemActionHelper} from "@/helper/device/CommonSystemActionHelper";
import {View} from "@/components/Themed";
import {FoodFeedbackRating} from "@/components/foodfeedback/FoodRatingDisplay";
import {FoodNotifyButton} from "@/components/foodfeedback/FoodNotifyButton";
import {MyButtonNavigation} from "@/components/buttons/MyButtonNavigation";

export default function BuildingDetails({ buildingId }: { buildingId: string }) {
	const [buildingsDict, setBuildingsDict] = useSynchedBuildingsDict()
	let building = buildingsDict?.[buildingId];

	if(building && typeof building === 'object'){
		return <BuildingDetailsWithObject building={building} />
	}
}

function BuildingDetailsDescription({ building }: { building: Buildings }) {
	const translations = building?.translations

	if (typeof translations === 'undefined' || typeof translations === 'string') {
		return null;
	}

	let usedTranslations = translations as TranslationEntry[];

	return <DirectusTranslatedMarkdown field={'content'} translations={usedTranslations} />
}

function getBuildingLocation(building: Buildings) {
	const coordinates = building.coordinates;
	if(!!coordinates){
		const location = CoordinateHelper.getLocation(coordinates);
		if(!!location){
			return location;
		}
	}
	return null;
}

function BuildingsInformation({ building }: { building: Buildings }) {
	const translation_open_navitation_to_location = useTranslation(TranslationKeys.open_navitation_to_location)
	const translation_coordinates = useTranslation(TranslationKeys.coordinates)
	const translation_copy_url = useTranslation(TranslationKeys.copy_url)
	const translation_copy = useTranslation(TranslationKeys.copy)
	const translation_year_of_construction = useTranslation(TranslationKeys.year_of_construction)
	const translation_unknown = useTranslation(TranslationKeys.unknown)

	const {copyText} = useMyClipboard();

	let buildingLocationInformation = undefined;
	const location = getBuildingLocation(building);
	if(!!location){
		buildingLocationInformation = <>
			<SettingsRow labelLeft={translation_open_navitation_to_location} accessibilityLabel={translation_open_navitation_to_location} leftIcon={IconNames.location_open_icon} onPress={() => {
				CommonSystemActionHelper.openMaps(location)
			}} />
			<SettingsRow rightIcon={IconNames.copy_icon} onPress={() => {
				copyText(CoordinateHelper.getLocationAsString(location));
			}} labelLeft={translation_coordinates} accessibilityLabel={translation_coordinates} labelRight={CoordinateHelper.getLocationAsString(location, true)} leftIcon={IconNames.location_icon} />
		</>
	}

	return <MyScrollView>
		<SettingsRowGroup>
			{buildingLocationInformation}
			<SettingsRow labelLeft={translation_year_of_construction} accessibilityLabel={translation_year_of_construction} labelRight={building.date_of_construction} leftIcon={"hard-hat"} />
			<SettingsRow labelLeft={translation_copy_url} accessibilityLabel={translation_copy_url} leftIcon={"link"} onPress={() => {
				copyText(building.url);
			}} />
		</SettingsRowGroup>
	</MyScrollView>
}

function BuildingNavigationButton({ building }: { building: Buildings }) {
	const location = getBuildingLocation(building);
	if(!!location) {
		return <MyButtonNavigation location={location}/>
	}
	return null;
}

export function BuildingDetailsWithObject({ building, additionalTabs }: { building: Buildings, additionalTabs?: DetailsComponentTabProps[] }) {

	const translation_description = useTranslation(TranslationKeys.description)
	const translation_information = useTranslation(TranslationKeys.information)

	let tabs: DetailsComponentTabProps[] = [
		{
			iconName: IconNames.description_icon,
			accessibilityLabel: translation_description,
			text: translation_description,
			content: <BuildingDetailsDescription building={building} />
		},
		{
			iconName: IconNames.fact_icon,
			accessibilityLabel: translation_information,
			text: translation_information,
			content: <BuildingsInformation building={building} />
		},
	]
	if(additionalTabs){
		tabs.push(...additionalTabs)
	}

	return (
		<DetailsComponent item={building} heading={
			building.alias
		}
		image={{
			assetId: building.image,
			image_url: building.image_remote_url,
		}}
		  subHeadingComponent={<View style={{flexDirection: 'row', justifyContent: 'space-between', flexWrap: "wrap"}}>
			  <View style={{ flex: 1, flexDirection: "row" }}>
				  <BuildingNavigationButton building={building} />
			  </View>
		  </View>
		}
	  tabs={tabs}
		/>
	)
}