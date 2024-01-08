import React, {FunctionComponent} from "react";
import {DetailsComponentMenus, DetailsComponentMenuType} from "./DetailsComponentMenus";
import {ScrollView, Text, View} from "native-base";
import {MyActionsheet} from "../../../kitcheningredients";
import {useDebugMode} from "../../helper/synchedJSONState";
import {DebugIcon} from "../icons/DebugIcon";

export type DetailsComponentMenuRelationType = {
	menu: DetailsComponentMenuType,
	renderContent?: (onClose?: () => void) => any,
}
export interface AppState{
	// menus are a dict with DetailsComponentMenuType as value and a string as key
	menus?: Record<string, DetailsComponentMenuType>,
	relations: Record<string, DetailsComponentMenuRelationType>,
	getOnClose?: (onClose: any) => void,
}
export const DetailsComponentMenusForRelations: FunctionComponent<AppState> = (props) => {

	const actionsheet = MyActionsheet.useActionsheet();
	const [debug, setDebug] = useDebugMode()

	function getDetailsComponentMenuForRelation(relation: DetailsComponentMenuRelationType){
		let menu = relation?.menu;
		if(menu?.amount === 0){
			if(debug){ // if debug mode is enabled, show the amount of relations
				menu.renderIcon = (backgroundColor, textColor) => {
					return <DebugIcon color={textColor} />
				}
			} else { // if not in debug mode, don't show the menu
				return null;
			}
		}

		let menuOnPress = menu.onPress;

		let relationOnPress = async () => {
			if(menuOnPress){
				return await menuOnPress();
			} else {
				const onClose = actionsheet.show({
					title: menu.renderContent(undefined, undefined),
					renderCustomContent: (onClose) => {
						return <ScrollView style={{width: "100%"}} >{relation?.renderContent(onClose)}</ScrollView>
					}
				});
				if(props?.getOnClose){
					//console.log("getOnClose");
					onClose();
					props.getOnClose(onClose);
				}
			}
		}
		let menuCopy = {
			...menu
		}
		menuCopy.onPress = relationOnPress;
		return menuCopy;
	}

	function getMenusForRelations(){
		const relations = props.relations;
		const relationKeys = Object.keys(relations);
		const menus = {};
		for(let relationKey of relationKeys){
			const relation = relations[relationKey];
			menus[relationKey] = getDetailsComponentMenuForRelation(relation);
		}
		return menus;
	}

	const menusForRelations = getMenusForRelations();
	const menusFromProps = props.menus || {};
	const menus = {...menusFromProps, ...menusForRelations};

	return(
		<DetailsComponentMenus menus={menus} spacer={null} style={{width: "100%", flexDirection: "row", flexWrap: "wrap", alignItems: "center"}} hideSelection={true} />
	)

}
