import React, {useEffect, useState} from "react";
import {Input, ScrollView, Text, View} from "native-base";
import {AvatarsEditor, getInitialAvatar} from "../../components/avatar/AvatarsEditor";
import {useSynchedRemoteSettings} from "../../helper/synchedJSONState";

export const AvatarsExample = (props) => {

	const [remoteAppSettings, setRemoteAppSettings] = useSynchedRemoteSettings();
	const enabledAvatarStyles = props.enabledAvatarStyles || remoteAppSettings?.enabledAvatarStyles
	const initialAvatarStyle = props.initialAvatarStyle || remoteAppSettings?.initialAvatarStyle


	let usedInitialAvatarStyle = initialAvatarStyle || enabledAvatarStyles[0];
	let initialAvatar = getInitialAvatar([usedInitialAvatarStyle])

	const [avatarString, setAvatarString] = useState(JSON.stringify(initialAvatar));
	const avatar = JSON.parse(avatarString);

	return(
		<>
			<Text>{"DiceBear Avatars"}</Text>
			<Text>{"Avatar: "}</Text>
			<Text>{JSON.stringify(avatar, null, 2)}</Text>
			<View style={{justifyContent: "center", alignItems: "center", width: "100%"}}>
				<AvatarsEditor initialAvatar={initialAvatar} enabledAvatarStyles={enabledAvatarStyles} onChangeAvatar={(avatar) => {
					setAvatarString(JSON.stringify(avatar))
				}}/>
			</View>
		</>
	)
}