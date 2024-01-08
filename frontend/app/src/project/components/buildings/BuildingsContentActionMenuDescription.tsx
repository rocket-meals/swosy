import React, {useEffect} from "react";
import {BasePadding} from "../../../kitcheningredients";
import {Button, Text, View} from "native-base";
import {useSynchedBuilding} from "../../helper/synchedJSONState";
import {DirectusTranslatedMarkdown} from "../../components/translations/DirectusTranslatedMarkdown";
import {AppTranslation, useAppTranslation} from "../../components/translations/AppTranslation";
import {DescriptionIcon} from "../../components/icons/DescriptionIcon";
import {InfoIcon} from "../icons/InfoIcon";
import {BuildingHelper} from "./BuildingHelper";
import {MyButton} from "../buttons/MyButton";
import {ExternalLinksIcon} from "../icons/ExternalLinkIcon";

export function BuildingsContentActionMenuDescription(resource_id, additionalContent?){
	const resource = useSynchedBuilding(resource_id);

	const openURL = useAppTranslation("openURL");
	const noURLFound = useAppTranslation("noURLFound");
	const moreInformations = useAppTranslation("moreInformations");

	function renderDescription(){
		return(
			<BasePadding>
				<DirectusTranslatedMarkdown item={resource} field={"content"} />
				{renderUrl()}
			</BasePadding>
		)
	}

	function renderUrl(){
		let url = BuildingHelper.getBuildingUrl(resource)
		let urlFound = !!url;
		if(!urlFound){
			return null;
		}

		let text = !!url ? openURL : noURLFound;
		return(
			<View>
				<Text>{moreInformations+":"}</Text>
				<MyButton renderIcon={(backgroundColor, textColor) => {
					return <ExternalLinksIcon color={textColor} />
				}} key={"url"} disabled={!url} onPress={() => {
					BuildingHelper.openURL(resource);
				}} label={text} ></MyButton>
			</View>
		)
	}

	const element = []

	if(resource){
		element.push(renderDescription());
	}
	if(additionalContent){
		element.push(additionalContent);
	}

	if(element.length > 0){
		return {
			element: renderDescription(),
			renderIcon: (backgroundColor, textColor) => {return <DescriptionIcon color={textColor} />},
			renderContent: (backgroundColor, textColor) => {return <AppTranslation color={textColor} id={"description"} />},
		}
	} else {
		return null;
	}
}
