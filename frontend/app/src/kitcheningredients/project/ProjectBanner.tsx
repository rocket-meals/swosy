// @ts-nocheck
import React, {FunctionComponent} from 'react';
import {Flex, View} from "native-base";
import {ServerInfo} from "@directus/sdk";
import {ProjectLogo} from "./ProjectLogo";
import {ProjectName} from "./ProjectName";
import ServerAPI from "../ServerAPI";

const titleBoxHeight = 64;

interface AppState {
	serverInfo?: ServerInfo;
	size?: string
}
export const ProjectBanner: FunctionComponent<AppState> = (props) => {
	const serverInfo = props.serverInfo || ServerAPI.tempStore.serverInfo;

	let boxHeight = titleBoxHeight;

	return(
		<View
			style={{flexDirection: "row" ,height: boxHeight, alignItems: "center"}}
		>
			<ProjectLogo serverInfo={serverInfo} rounded={true} titleBoxHeight={boxHeight-4} />
			<ProjectName serverInfo={serverInfo} />
		</View>
	)
}
