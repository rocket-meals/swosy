import React, {FunctionComponent, useEffect} from "react";
import {BaseNoPaddingTemplate, Icon, Layout, MyThemedBox, Navigation, NavigatorHelper} from "../../../kitcheningredients";
import {Text, View} from "native-base";
import {useDebugMode, useDemoMode, useSynchedApartment} from "../../helper/synchedJSONState";
import {AppTranslation, useAppTranslation} from "../../components/translations/AppTranslation";
import {SettingsRow} from "../../components/settings/SettingsRow";
import {SettingsSpacer} from "../../components/settings/SettingsSpacer";
import {DetailsComponentMenus} from "../../components/detailsComponent/DetailsComponentMenus";
import {DebugIcon} from "../../components/icons/DebugIcon";
import {DetailsComponentMenusForRelations} from "../../components/detailsComponent/DetailsComponentMenusForRelations";
import {BuildingsList} from "../../components/buildings/BuildingsList";
import {BuildingsContent} from "../buildings/BuildingsContent";
import {BuildingsContentActionMenuDescription} from "../../components/buildings/BuildingsContentActionMenuDescription";
import {BuildingsContentActionMenuBuildingInformation} from "../../components/buildings/BuildingsContentActionMenuBuildingInformation";
import {ApartmentCard} from "../../components/housing/ApartmentCard";
import {WashingmachineList} from "../../components/washingmachine/WashingmachineList";
import {
	useSynchedProfileBuildingsLastVisited,
	useSynchedProfileBuildingsLastVisitedDict
} from "../../components/profile/ProfilesBuildingsLastVisitedAPI";

export const ApartmentContent: FunctionComponent = (props) => {
	const resource_id = props?.route?.params?.id;

	const translation_title = useAppTranslation("apartment");
	const [debug, setDebug] = useDebugMode()

	const resource = useSynchedApartment(resource_id);
	const resourceId = resource?.id;

	let washingmachine_ids = resource?.washingmachines || [];

	/** Relations */
	//console.log("Relations")
	const building_id = resource?.building;
	console.log("building_id: "+building_id);
	const [profileBuildingLastVisited, updateProfileBuildingLastVisited] = useSynchedProfileBuildingsLastVisited(building_id);

	const [lastVisitedBuildingDict, addLastVisited, removeLastVisited] = useSynchedProfileBuildingsLastVisitedDict();

	const building_ids = building_id ? [building_id] : [];

	const menus = {
		"information": BuildingsContentActionMenuBuildingInformation(building_id),
		"buildingDescription": BuildingsContentActionMenuDescription(building_id),
	}

	const amountWashingmachines = washingmachine_ids.length;
	if(amountWashingmachines > 0){
		menus["washingmachines"] = {
			element: renderWashingMachines(),
			menuButtonContent: <Text><AppTranslation id={"washingmachines"}/>{" ("+amountWashingmachines+")"}</Text>,
			icon: <Icon name={"washing-machine"} />
		}
	}

	if(debug) {
		menus["Debug"] = {
			element: renderDebug(),
			menuButtonContent: <AppTranslation id={"debug"}/>,
			icon: <DebugIcon />
		};
	}



	function renderWashingMachines(){
		return <WashingmachineList resource_ids={washingmachine_ids} />
	}

	function renderDebug(){
		let output = [];
		output.push(<SettingsRow leftIcon={"tag"} leftContent={<Text>{"ID: "+resource?.id}</Text>} />)
		output.push(<SettingsRow leftIcon={"code-braces"} leftContent={<View style={{flexDirection:'row', flex: 1}}><Text style={{flex: 1, flexWrap: 'wrap'}}>{"Canteen:\n"}{JSON.stringify(resource, null, 2)}</Text></View>} />)
		output.push(<SettingsRow leftIcon={"code-braces"} leftContent={<View style={{flexDirection:'row', flex: 1}}><Text style={{flex: 1, flexWrap: 'wrap'}}>{"Last Visited:\n"}{JSON.stringify(lastVisitedBuildingDict, null, 2)}</Text></View>} />)

		return(
			output
		)
	}


	// corresponding componentDidMount
	useEffect(() => {
		console.log("UPDATE LAST VISITED BUILDING !");
		updateProfileBuildingLastVisited();
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
		<BaseNoPaddingTemplate title={translation_title} route={{params: {showbackbutton: true}}} >
			<View style={{width: "100%", paddingTop: Layout.padding}}>
				<ApartmentCard key={resourceId} resource_id={resourceId} small={false} />
				{renderActionRow()}
				<SettingsSpacer />
				<DetailsComponentMenus menus={menus} />
			</View>
		</BaseNoPaddingTemplate>
	)
}
