import React, {FunctionComponent} from "react";
import {HeaderWithActions, Icon, MyActionsheet} from "../../../kitcheningredients";
import {Button} from "native-base";
import {useAppTranslation} from "../translations/AppTranslation";
import {SortIcon} from "../icons/SortIcon";
import {MyTouchableOpacity} from "../buttons/MyTouchableOpacity";

export enum BuildingsSortType{
	intelligent = "intelligent",
	distance = "distance",
	alphabetical = "alphabetical",
	favorites = "favorites",
	last_visited = "last_visited"
}
export const sortTypeTranslations = {
	[BuildingsSortType.intelligent]: "intelligent",
	[BuildingsSortType.distance]: "distance",
	[BuildingsSortType.alphabetical]: "alphabetical",
	[BuildingsSortType.favorites]: "favorites",
	[BuildingsSortType.last_visited]: "last_visited",
}
export const initialSortType = Object.keys(sortTypeTranslations)[0];

export interface AppState{
	sortBy: any,
	setSortBy: any,
}
export const BuildingsListHeader: FunctionComponent<AppState> = (props) => {


	const actionsheet = MyActionsheet.useActionsheet();

	const title = useAppTranslation("buildings");

	const translationSortBy = useAppTranslation("sortBy");

	const translation = {}
	let sortTypeTranslationKeys = Object.keys(sortTypeTranslations);
	for(let index = 0; index<sortTypeTranslationKeys.length; index++){
		let sortTypeTranslationKey = sortTypeTranslationKeys[index];
		translation[sortTypeTranslationKey] = useAppTranslation(sortTypeTranslationKey);
	}

	const setSortBy = props?.setSortBy;

	function onPressSort(){
		//console.log("onPressSort");
		actionsheet.show({
			title: translationSortBy,
			onOptionSelect: (key) => {
				//console.log(key);
				setSortBy(key);
			}
		}, translation);
	}

	function renderActions(){
		return (
			<>
				<Button style={{backgroundColor: "transparent"}} onPress={() => {
		//							NavigatorHelper.navigateWithoutParams(FoodList, false, {showbackbutton: true});
				}}>
					<Icon name={"magnify"} />
				</Button>
				<MyTouchableOpacity accessibilityLabel={translationSortBy} onPress={() => {
					onPressSort()
				}}>
					<SortIcon />
				</MyTouchableOpacity>
			</>
		)
	}

	function renderHeader(){
		return <HeaderWithActions title={title} route={props?.route} renderActions={renderActions} renderCustomBottom={null} />

	}

	return(
		renderHeader()
	)
}
