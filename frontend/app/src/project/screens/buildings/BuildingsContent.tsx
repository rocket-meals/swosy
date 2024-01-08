import React, {FunctionComponent, useEffect} from "react";
import {BaseNoPaddingTemplate, Layout, MyThemedBox, Navigation} from "../../../kitcheningredients";
import {Text, View} from "native-base";
import {useDebugMode, useSynchedBuilding} from "../../helper/synchedJSONState";
import {AppTranslation, useAppTranslation} from "../../components/translations/AppTranslation";
import {BuildingsCard} from "../../components/buildings/BuildingsCard";
import {BuildingHelper} from "../../components/buildings/BuildingHelper";
import {ShowLocationIcon} from "../../components/icons/ShowLocationIcon";
import {SettingsRow} from "../../components/settings/SettingsRow";
import {SettingsSpacer} from "../../components/settings/SettingsSpacer";
import {DetailsComponentMenus} from "../../components/detailsComponent/DetailsComponentMenus";
import {DebugIcon} from "../../components/icons/DebugIcon";
import {CanteenList} from "../../components/canteen/CanteenList";
import {CanteenIcon} from "../../components/canteen/CanteenIcon";
import {DetailsComponentMenusForRelations} from "../../components/detailsComponent/DetailsComponentMenusForRelations";
import {CanteenContent} from "../canteen/CanteenContent";
import {BuildingsContentActionMenuDescription} from "../../components/buildings/BuildingsContentActionMenuDescription";
import {BuildingsContentActionMenuBuildingInformation} from "../../components/buildings/BuildingsContentActionMenuBuildingInformation";
import {ApartmentList} from "../../components/housing/ApartmentList";
import {HousingIcon} from "../../components/housing/HousingIcon";
import {ApartmentContent} from "../housing/ApartmentContent";
import {IdIcon} from "../../components/icons/IdIcon";
import {useSynchedProfileBuildingsLastVisited} from "../../components/profile/ProfilesBuildingsLastVisitedAPI";

export const BuildingsContent: FunctionComponent = (props) => {
	const resource_id = props?.route?.params?.id;

	const translation_title = useAppTranslation("buildings");

	const [debug, setDebug] = useDebugMode()
	const resource = useSynchedBuilding(resource_id);
	//console.log("resource", resource);

	const resourceId = resource?.id;

	const [profileBuildingLastVisited, updateProfileBuildingLastVisited] = useSynchedProfileBuildingsLastVisited(resourceId);

	/** Relations */
	//console.log("Relations")
	const canteen_ids = resource?.canteens || [];
	const apartment_ids = resource?.apartments || [];

	const menus = {
		"information": BuildingsContentActionMenuBuildingInformation(resource_id),
		"description": BuildingsContentActionMenuDescription(resource_id),
	}
	if(debug) {
		menus["Debug"] = {
			element: renderDebug(),
			renderIcon: (backgroundColor, textColor) => {return <DebugIcon color={textColor} />},
			renderContent: (backgroundColor, textColor) => {return <AppTranslation color={textColor} id={"debug"} />},
		};
	}

	function renderDebug(){
		let output = [];
		output.push(<SettingsRow leftIcon={<IdIcon />} leftContent={"ID"} rightContent={resource?.id+""} />)
		output.push(<SettingsRow leftIcon={"code-braces"} leftContent={<View style={{flexDirection:'row', flex: 1}}><Text style={{flex: 1, flexWrap: 'wrap'}}>{"Building:\n"}{JSON.stringify(resource, null, 2)}</Text></View>} />)

		return(
			output
		)
	}

	// corresponding componentDidMount
	useEffect(() => {
		updateProfileBuildingLastVisited();
	}, [props]);

	function getDetailsComponentMenusForRelations(){

		return {
			"canteens": {
				menu: {
					renderIcon: (backgroundColor, textColor) => {return <CanteenIcon color={textColor} />},
					renderContent: (backgroundColor, textColor) => {return <AppTranslation color={textColor} id={"canteens"} />},
					amount: canteen_ids.length,
				},
				renderContent: (onClose) => {
					//console.log("On rendering canteen list")
					return <CanteenList resource_ids={canteen_ids} withoutOverlay={true} onPress={(resourceId) => {
						Navigation.navigateTo(CanteenContent, {id: resourceId, showbackbutton: true})
//						NavigatorHelper.navigateWithoutParams(CanteenContent, false, {id: resourceId, showbackbutton: true})
						if(onClose){
							onClose();
						}
					}} />
				}
			},
			"apartments": {
				menu: {
					renderIcon: (backgroundColor, textColor) => {return <HousingIcon color={textColor} />},
					renderContent: (backgroundColor, textColor) => {return <AppTranslation color={textColor} id={"housing"} />},
					amount: apartment_ids.length,
				},
				renderContent: (onClose) => {
					//console.log("On rendering canteen list")
					return <ApartmentList resource_ids={apartment_ids} withoutOverlay={true} onPress={(resourceId) => {
						Navigation.navigateTo(ApartmentContent, {id: resourceId, showbackbutton: true})
//						NavigatorHelper.navigateWithoutParams(ApartmentContent, false, {id: resourceId, showbackbutton: true})
						if(onClose){
							onClose();
						}
					}} />
				}
			},
		}
	}

	function renderActionRow(){
		const actionRowMenus = {
			"openLocation": {
				renderIcon: (backgroundColor, textColor) => {return <ShowLocationIcon color={textColor} />},
				renderContent: (backgroundColor, textColor) => {return <AppTranslation color={textColor} id={"openNavigationToLocation"} />},
				onPress: () => {BuildingHelper.openLocation(resource)}
			}
		}

		return(
			<MyThemedBox key={"food_rating"} _shadeLevel={3} style={{paddingVertical: "1%", paddingHorizontal: "1%"}}>
				<View style={{width: "100%", flexDirection: "row"}}>
					<DetailsComponentMenusForRelations menus={actionRowMenus} relations={getDetailsComponentMenusForRelations()} />
				</View>
			</MyThemedBox>
		)
	}

	return(
		<BaseNoPaddingTemplate title={translation_title} route={{params: {showbackbutton: true}}} >
			<View style={{width: "100%", paddingTop: Layout.padding}}>
				<BuildingsCard key={resourceId} resource_id={resourceId} small={false} />
				{renderActionRow()}
				<SettingsSpacer />
				<DetailsComponentMenus menus={menus} />
			</View>
		</BaseNoPaddingTemplate>
	)
}
