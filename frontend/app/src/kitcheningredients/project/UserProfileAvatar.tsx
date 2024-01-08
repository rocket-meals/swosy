// @ts-nocheck
import React, {FunctionComponent, useEffect, useState} from 'react';
import {View, Text} from "native-base";
import {UserItem} from "@directus/sdk";
import ServerAPI from "../ServerAPI";
import {DirectusImage} from "./DirectusImage";

import {Icon} from "../components/Icon";
import {ConfigHolder} from "./../ConfigHolder";
import {MyTouchableOpacity} from "../components/buttons/MyTouchableOpacity";

const titleBoxHeight = 48;

interface AppState {
	user?: UserItem;
	accessibilityLabel?: string;
	color?: string,
	onPress?: () => void
	heightAndWidth?: string
}
export const UserProfileAvatar: FunctionComponent<AppState> = (props) => {

	const [displayUser, setUser] = useState(props.user || null);
	const [reloadnumber, setReloadnumber] = useState(0)

	const directus = ServerAPI.getClient();

  let usedColor = props?.color

	async function loadUserInformation(){
		let me = await ServerAPI.getMe(directus);
		setUser(me);
		setReloadnumber(reloadnumber+1);
	}

	// corresponding componentDidMount
	useEffect(() => {
		if(!props.user){
			loadUserInformation();
		}
	}, [])

	let avatarAssetId = displayUser?.avatar;

	let content = (
		<Icon
			name={"account-circle"}
      color={usedColor}
			style={{}}
		/>
	)

	if(!!avatarAssetId){
		content = <DirectusImage reloadnumber={reloadnumber+""} showLoading={true} assetId={avatarAssetId} style={{height: "100%", width: "100%"}} />;
	}

	let customUserAvatar = ConfigHolder.plugin?.renderCustomUserAvatar(displayUser);
	if(!!customUserAvatar){
	  content = customUserAvatar;
  }

	let dimension = props?.heightAndWidth || titleBoxHeight;

	if(!!props.onPress){
		return(
			// @ts-ignore
			<MyTouchableOpacity accessibilityLabel={props?.accessibilityLabel} onPress={props.onPress} style={{height: dimension, width: dimension, borderRadius: 6, alignItems: "center", justifyContent: "center"}}>
				{content}
			</MyTouchableOpacity>
		)
	} else {
		return(
			// @ts-ignore
			<View style={{height: dimension, width: dimension, borderRadius: 6, alignItems: "center", justifyContent: "center"}}>
				{content}
			</View>
		)
	}
}
