// @ts-nocheck
import React, {FunctionComponent} from 'react';
import {View} from "native-base";
import {ServerInfoHelper} from "../helper/ServerInfoHelper";
import {ServerInfo} from "@directus/sdk";
import {DirectusImage} from "./DirectusImage";
import ServerAPI from "../ServerAPI";

interface AppState {
	serverInfo?: ServerInfo;
}
export const ProjectBackground: FunctionComponent<AppState> = (props) => {

	const serverInfo = props.serverInfo || ServerAPI.tempStore.serverInfo;

	let imageBackgroundAssetId = ServerInfoHelper.getProjectBackgroundAssetId(serverInfo)
	let project_color = ServerInfoHelper.getProjectColor(serverInfo);

	let fallbackStyle = {};
	if(!imageBackgroundAssetId){
		fallbackStyle = {backgroundColor: project_color};
	}

	return(
		<View style={{flex: 1}}>
			<DirectusImage alt={""}
						   assetId={imageBackgroundAssetId}
						   isPublic={true}
						   style={[{flex: 1}, fallbackStyle]} />
		</View>
	)
}