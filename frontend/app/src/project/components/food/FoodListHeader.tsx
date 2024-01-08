import React, {FunctionComponent, useEffect, useRef, useState} from "react";
import {BackButton, Icon} from "../../../kitcheningredients";
import {Input, View} from "native-base";
import {useAppTranslation} from "../translations/AppTranslation";

export interface AppState{
	handleSearch: any,
}
export const FoodListHeader: FunctionComponent<AppState> = (props) => {

	const textSearch = useAppTranslation("search");

	const searchInput = useRef(null);

	const [search, setSearch] = useState(undefined);

	const delayBeforeNotifyInMs = 500;
	function notifySearch(){
		props.handleSearch(search, true);
	}

	useEffect(() => {
		if (searchInput?.current) {
			searchInput.current.focus();
		}

		const timeOutId = setTimeout(() => notifySearch(), delayBeforeNotifyInMs);
		return () => clearTimeout(timeOutId);
	}, [search]);

	function renderDrawerButton(){
		return <BackButton />
	}

	function renderSearchbar(){
		return(
			<View style={{width: "100%", justifyContent: "center", alignItems: "center", flexDirection: "row"}}>
				<Input
					size={"md"}
					ref={searchInput}
					placeholder={textSearch}
					onChangeText={(text) => {
						if(!!text && text.length > 0){
							props.handleSearch(search, false);
							setSearch(text)
						} else {
							props.handleSearch(undefined, false);
							setSearch(undefined);
						}
					}} value={search} style={{flex: 1}} />
				<Icon name={"magnify"} />
			</View>
		)
	}

	function renderHeader(){
		return(
			<View style={{width: "100%"}}>
				<View style={{flexDirection: "row", width: "100%", alignItems: "center"}}>
					{renderDrawerButton()}
					<View style={{flex: 1 ,justifyContent: "flex-start"}}>
						{renderSearchbar()}
					</View>
				</View>
			</View>
		)
	}

	return(
		renderHeader()
	)
}
