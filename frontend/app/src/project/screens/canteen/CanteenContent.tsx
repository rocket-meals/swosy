import React, {FunctionComponent, useEffect} from "react";
import {BaseNoPaddingTemplate, Icon, Layout, MyThemedBox, Navigation, NavigatorHelper} from "../../../kitcheningredients";
import {Text, View} from "native-base";
import {useDebugMode, useSynchedCanteen} from "../../helper/synchedJSONState";
import {AppTranslation, useAppTranslation} from "../../components/translations/AppTranslation";
import {SettingsRow} from "../../components/settings/SettingsRow";
import {SettingsSpacer} from "../../components/settings/SettingsSpacer";
import {DetailsComponentMenus} from "../../components/detailsComponent/DetailsComponentMenus";
import {DebugIcon} from "../../components/icons/DebugIcon";
import {DetailsComponentMenusForRelations} from "../../components/detailsComponent/DetailsComponentMenusForRelations";
import {BuildingsList} from "../../components/buildings/BuildingsList";
import {CanteenCard} from "../../components/canteen/CanteenCard";
import {BuildingsContent} from "../buildings/BuildingsContent";
import {BuildingsContentActionMenuDescription} from "../../components/buildings/BuildingsContentActionMenuDescription";
import {BuildingsContentActionMenuBuildingInformation} from "../../components/buildings/BuildingsContentActionMenuBuildingInformation";
import {Businesshours} from "../../components/businesshours/Businesshours";
import {CanteenHelper} from "../../components/canteen/CanteenHelper";

export const CanteenContent: FunctionComponent = (props) => {
	const resource_id = props?.route?.params?.id;

	const [debug, setDebug] = useDebugMode()
	const translation_title = useAppTranslation("canteen");

	const resource = useSynchedCanteen(resource_id);
	const resourceId = resource?.id;

	const businesshours_ids = CanteenHelper.getBusinesshoursIds(resourceId);

	/** Relations */
	//console.log("Relations")
	const building_id = resource?.building;

	const building_ids = building_id ? [building_id] : [];

	const menus = {
		"information": BuildingsContentActionMenuBuildingInformation(building_id),
		"buildingDescription": BuildingsContentActionMenuDescription(building_id),
	}
	menus["businesshours"] = {
		element: renderBusinessHours(),
		renderIcon: (backgroundColor, textColor) => { return <Icon name={"clock"} color={textColor} />},
		renderContent: (backgroundColor, textColor) => { return <AppTranslation id={"businesshours"} color={textColor} />},
	}

	if(debug) {
		menus["Debug"] = {
			element: renderDebug(),
			renderIcon: (backgroundColor, textColor) => { return <DebugIcon color={textColor} />},
			renderContent: (backgroundColor, textColor) => { return <AppTranslation id={"debug"} color={textColor} />},
		};
	}



	function renderBusinessHours(){
		return <Businesshours resource_ids={businesshours_ids} />;
//		return <Text>{JSON.stringify(businesshours_ids)}</Text>
	}

	function renderDebug(){
		let output = [];
		output.push(<SettingsRow leftIcon={"tag"} leftContent={<Text>{"ID: "+resource?.id}</Text>} />)
		output.push(<SettingsRow leftIcon={"code-braces"} leftContent={<View style={{flexDirection:'row', flex: 1}}><Text style={{flex: 1, flexWrap: 'wrap'}}>{"Canteen:\n"}{JSON.stringify(resource, null, 2)}</Text></View>} />)

		return(
			output
		)
	}


	// corresponding componentDidMount
	useEffect(() => {
	}, [props]);

	function getDetailsComponentMenusForRelations(){

		const relations = {
		}

		if(debug){
			relations["buildings"] = {
				menu: {
					renderContent: (backgroundColor, textColor) => {return <AppTranslation color={textColor} id={"buildings"} />},
					renderIcon: (backgroundColor, textColor) => {return <DebugIcon color={textColor} id={"buildings"} />},
					amount: building_ids.length,
				},
					renderContent: (onClose) => {
						return <BuildingsList resource_ids={building_ids} withoutOverlay={true} onPress={(resourceId) => {
							Navigation.navigateTo(BuildingsContent, {id: resourceId, showbackbutton: true})
//							NavigatorHelper.navigateWithoutParams(BuildingsContent, false, {id: resourceId, showbackbutton: true})
							if(onClose){
								onClose();
							}
						}} />
					}
			}
		}

		return relations;
	}

	function renderActionRow(){
		const actionRowMenus = {}

		const detailsComponentMenusForRelations = getDetailsComponentMenusForRelations();

		return(
			<MyThemedBox key={"food_rating"} _shadeLevel={3} style={{paddingVertical: "1%", paddingHorizontal: "1%"}}>
				<View style={{width: "100%", flexDirection: "row"}}>
					<DetailsComponentMenusForRelations menus={actionRowMenus} relations={detailsComponentMenusForRelations} />
				</View>
			</MyThemedBox>
		)
	}

	return(
		<BaseNoPaddingTemplate title={translation_title} route={props?.route} >
			<View style={{width: "100%", paddingTop: Layout.padding}}>
				<CanteenCard key={resourceId} resource_id={resourceId} small={false} />
				{renderActionRow()}
				<SettingsSpacer />
				<DetailsComponentMenus menus={menus} />
			</View>
		</BaseNoPaddingTemplate>
	)
}
