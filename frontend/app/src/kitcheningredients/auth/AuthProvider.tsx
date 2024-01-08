// @ts-nocheck
import React, {FunctionComponent} from 'react';
import {Flex, Link, Text, useColorMode, View,} from "native-base";
import {MaterialIcons} from "@expo/vector-icons"
import EnviromentHelper from "../EnviromentHelper";
import {StringHelper} from "../helper/StringHelper";
import ServerAPI from "../ServerAPI";
import {Provider} from "./Provider";
import {TouchableOpacity} from "react-native";
import {ServerInfoHelper} from "../helper/ServerInfoHelper";
import {Icon} from "../components/Icon";
import * as ExpoLinking from "expo-linking";
import {ConfigHolder} from "../ConfigHolder";
import {URL_Helper} from "../helper/URL_Helper";
import {TranslationKeys} from "../translations/TranslationKeys";
import ColorCodeHelper from "../theme/ColorCodeHelper";
import {useThemedShade} from "../helper/MyThemedBox";
import {useMyContrastColor} from "../theme/useMyContrastColor";
import {ServerInfo} from "@directus/sdk";

interface AppState {
	serverInfo: ServerInfo;
	loading?: boolean,
	provider: Provider;
	buttonText?: any;
	callback?: any;
}

export const AuthProvider: FunctionComponent<AppState> = ({serverInfo, provider, buttonText, callback}) => {

  const useTranslation = ConfigHolder.plugin.getUseTranslationFunction();
  const translation_log_in_with = useTranslation(TranslationKeys.log_in_with);

	const isDarkMode = ColorCodeHelper.isDarkMode()
	const backgroundColor = useThemedShade(6);
	const textColor = useMyContrastColor(backgroundColor)
//	const backgroundColor = isDarkMode ? "#A9A9A9FF" : "#F0F4F9FF"

	function getUrlToProvider(provider: string){
		provider= provider.toLowerCase();
		console.log("getUrlToProvider: "+provider);
		let redirectURL = URL_Helper.getURLToBase();
		console.log("RedirectURL: "+redirectURL)
		let redirect_with_access_token = "?redirect="+ServerAPI.getAPIUrl()+"/redirect-with-token?redirect="+redirectURL+"?"+EnviromentHelper.getDirectusAccessTokenName()+"=";
		let totalURL = ServerAPI.getAPIUrl()+"/auth/login/"+provider+redirect_with_access_token;
		return totalURL
	}

	function renderIcon(icon, color){
	  if(typeof icon!=="string"){
	    return icon(color);
    }

	  let family = null;

    if (MaterialIcons.glyphMap.hasOwnProperty(icon)) {
      family = MaterialIcons;
    }

		return (
			<Icon
				name={icon}
        as={family}
				color={color}
				style={{}}
			/>
		);
	}


	let providerName = provider?.name || "";
	let icon = provider?.icon;

	if(!!icon && icon!=="incognito-circle"){
	  // replace all _ with - for icon names
    icon = icon.replace(/_/g, "-");
  }

	let ssoIconStyle = ServerInfoHelper.getSsoIconStyle(serverInfo);

	let iconBackgroundColor = ssoIconStyle?.background;

	let url = getUrlToProvider(providerName);
	let providerNameReadable = StringHelper.capitalizeFirstLetter(providerName);
	if(!!provider?.label){
	      providerNameReadable = provider?.label;
  }

	let text = buttonText || translation_log_in_with+" "+providerNameReadable;

	let content = (
		<Flex flexDirection={"row"} style={{borderRadius: 6, flex: 1, backgroundColor: backgroundColor}}>
			<View style={{height: 50, width: 50, alignItems: "center", justifyContent: "center", backgroundColor: iconBackgroundColor, borderRadius: 6}}>
				{renderIcon(icon, ssoIconStyle.color)}
			</View>
			<View style={{justifyContent: "center", flex: 1, paddingLeft: 20}}>
				<Text color={textColor}>{text}</Text>
			</View>
		</Flex>
	);

	let touchableContent = null;

	if(!!callback){
		touchableContent = (
      <TouchableOpacity onPress={callback} >
        {content}
      </TouchableOpacity>
    )
	} else {
	  touchableContent = (
      <Link key={"Link"+providerName} href={url} >
        {content}
      </Link>
    )
  }

	return (
	  <View style={{marginVertical: 6, width: "100%"}}>
      {touchableContent}
    </View>
	)
}
