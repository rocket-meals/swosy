// @ts-nocheck
import React, {FunctionComponent} from 'react';
import {AuthProvider} from "./AuthProvider";
import {Provider} from "./Provider";
import {NavigatorHelper} from "../navigation/NavigatorHelper";
import {Home} from "../screens/home/Home";
import {ConfigHolder} from "../ConfigHolder";
import {ServerInfo} from "@directus/sdk";

interface AppState {
	serverInfo: ServerInfo;
	loading?: boolean,
  buttonText: string,
  name: string,
  icon: any,
  onPress: any,
}

export const AuthProviderCustom: FunctionComponent<AppState> = (props) => {

	let provider: Provider = {
		name: props.name,
		icon: props.icon
	};

	return (
		<AuthProvider serverInfo={props?.serverInfo} provider={provider} buttonText={props.buttonText} callback={props.onPress} />
	)
}
