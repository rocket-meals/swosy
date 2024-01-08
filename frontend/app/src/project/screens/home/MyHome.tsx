import React, {FunctionComponent, useEffect, useState} from "react";
import {Navigation, NavigatorHelper, useSynchedState} from "../../../kitcheningredients";
import {View, Text} from "native-base";
import {FoodOfferList} from "../food/FoodOfferList";
import {SynchedStateKeys} from "../../helper/synchedVariables/SynchedStateKeys";
import {useSynchedProfile} from "../../components/profile/ProfileAPI";
import {ActivityIndicator} from "react-native";

export const MyHome: FunctionComponent = (props) => {

	setTimeout(() => {
//		Navigation.navigateTo(FoodOfferList, {key: Math.random()});
	},1);

	//NavigatorHelper.navigateWithoutParams(FoodOfferList, true, {});

	return(
		<View style={{width: "100%", height: "100%", justifyContent: "center", alignItems: "center"}}>
			<ActivityIndicator size={"large"} />
		</View>
	)
}
