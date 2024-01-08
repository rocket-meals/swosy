// @ts-nocheck
import React, {FunctionComponent} from 'react';
import {View, Text} from "native-base";
import {Platform} from "react-native";
import {WebView} from "react-native-webview";

interface AppState {
	html: string,
	style?: any
}
export const RenderHTML: FunctionComponent<AppState> = (props) => {

	let isWeb = Platform.OS === "web";
	if(isWeb){
		return <View style={{flex: 1}}>
			<Text>
				<div dangerouslySetInnerHTML={{__html: props.html}} />
			</Text>
		</View>
	}

	return (
		<WebView
			style={props.style}
			source={{html: props.html}}
		>
		</WebView>
	)
}