// @ts-nocheck
import React, {FunctionComponent} from 'react';
import {Text, View} from "native-base";
import {ServerInfoHelper} from "../helper/ServerInfoHelper";
import {ServerInfo} from "@directus/sdk";
import ServerAPI from "../ServerAPI";

interface AppState {
	serverInfo?: ServerInfo;
	themedColor?: boolean;
}
export const ProjectName: FunctionComponent<AppState> = (props) => {
	const serverInfo = props.serverInfo || ServerAPI.tempStore.serverInfo;

	let project_name = ServerInfoHelper.getProjectName(serverInfo);
	let project_color = undefined //ServerInfoHelper.getProjectColor(serverInfo);
	let project_version = ServerInfoHelper.getProjectVersion();

	let color = project_color;
	if(props.themedColor){
		color = null;
	}

	function renderVersion(){
		return(
			<View style={{marginTop: 0, marginLeft: 0, justifyContent: "center"}}>
				<Text fontSize={"sm"} color={color}>
					{"v" + project_version}
				</Text>
			</View>
		)
	}

	return(
		<View style={{marginTop: 0, marginLeft: 16, justifyContent: "center"}}>
      <View style={{marginTop: 0, marginLeft: 0, justifyContent: "center"}}>
        <Text fontSize="2xl" fontWeight={"bold"} color={color}>
          {project_name}
        </Text>
      </View>
			{renderVersion()}
		</View>
	)
}
