// noinspection TypeScriptUnresolvedVariable

import React, {useEffect, useState} from "react";
import {Button, Input, Spacer, Text, View} from "native-base";
import {Menu, Navigation, NavigatorHelper, RegisteredRoutesMap, ServerAPI} from "../../../../kitcheningredients";

export const Debug = (props) => {

	function renderNavigateButton(route){
		return(
			<>
			<Button onPress={() => {
				Navigation.navigateTo(route);
//				NavigatorHelper.navigateToRouteName(route)
			}} >
				<Text>{"Test Navigation: "+route}</Text>
			</Button>
			<Spacer />
			</>
		)
	}

	function renderNavigateComponent(component){
		return(
			<>
				<Button onPress={() => {
					Navigation.navigateTo(component);
//					NavigatorHelper.navigateWithoutParams(component)
				}} >
					<Text>{"Test Navigation: "+RegisteredRoutesMap.getRouteByComponent(component)}</Text>
				</Button>
				<Spacer />
			</>
		)
	}

	return(
		<View style={{width: "100%", height: "100%"}}>
			<Text>{"Custom Debug"}</Text>
		</View>
	)
}

