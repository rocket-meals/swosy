import React, {FunctionComponent, useEffect, useState} from "react";
import {GridList} from "../GridList";
import {CanteenCard} from "./CanteenCard";
import {NotFound} from "../animations/NotFound";
import {View, Text} from "native-base";
import {TouchableOpacity} from "react-native";
import {AppTranslation} from "../translations/AppTranslation";
import {useSynchedCanteensDict} from "../../helper/synchedJSONState";
import {useSynchedProfile, useSynchedProfileCanteen} from "../profile/ProfileAPI";

interface AppState {
	resource_ids: string[] | number[];
	onPress?: (resourceId: string | number) => void;
	withoutOverlay?: boolean;
}
export const CanteenList: FunctionComponent<AppState> = (props) => {

	const [canteensDict, setCanteensDict] = useSynchedCanteensDict();
	const [profileCanteenId, setProfileCanteenId] = useSynchedProfileCanteen();

	const notFoundError = canteensDict===null ?  <NotFound /> : null;

	let renderedCards = [];

	if(canteensDict===null){
		return <View>
			<NotFound />
				<View style={{margin: 10, backgroundColor: "orange"}}>
					<AppTranslation id={"somethingWentWrong"} />
				</View>
		</View>
	} else if(canteensDict===undefined) {
		for(let i=0; i<10; i++){
			renderedCards.push(<CanteenCard resource_id={null} onPress={props?.onPress} withoutOverlay={props?.withoutOverlay} />)
		}
	} else {
		for(let canteenId of props?.resource_ids){
			const highlight = canteenId==profileCanteenId && !!canteenId;
			renderedCards.push(<CanteenCard highlight={highlight} resource_id={canteenId} onPress={props?.onPress} withoutOverlay={props?.withoutOverlay} />)
		}
	}

	return(
		<GridList>
			{renderedCards}
		</GridList>
	)
}
