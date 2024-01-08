// @ts-nocheck
import React, {useEffect, useState} from "react";
import {Pressable, Text, TextArea, View} from "native-base";
import {UserProfileAvatar} from "../../project/UserProfileAvatar";
import ServerAPI from "../../ServerAPI";
import {MyThemedBox} from "../../helper/MyThemedBox";

import {MyAlertDialog} from "../../helper/MyAlertDialog";
import {TouchableOpacity} from "react-native";
import {Icon} from "../../components/Icon";
import {keyof} from "ts-keyof";
import {Settings} from "../settings/Settings";

export const Users = (props) => {

	const user_id = props?.route?.params?.id;

	const [user, setUser] = useState(null);
	const [role, setRole] = useState(null);
	const [firstload, setFirstload] = useState(true);
	const [showmore, setShowmore] = useState(false);

	async function loadData(){
		try{
			let directus = ServerAPI.getClient();
			let remoteUser = await directus.users.readOne(user_id);
			setUser(remoteUser);

			let remoteRole = await ServerAPI.loadRole(remoteUser?.role);
			setRole(remoteRole);
		} catch (err){
			console.log(err);
		}
	}

	// corresponding componentDidMount
	useEffect(() => {
		if(firstload){
			setFirstload(false);
			loadData();
		}
	}, [props?.route?.params])

	function renderUserImage(){

		return(
			<MyThemedBox _shadeLevel={2} style={{marginRight: 20, justifyContent: "center", alignItems: "center", height: 142, width: 142, borderRadius: 152, overflow: "hidden"}}>
				<View style={{height: 132, width: 132, borderRadius: 132, overflow: "hidden"}}>
					<UserProfileAvatar heightAndWidth={"100%"} user={user} />
				</View>
			</MyThemedBox>
		)
	}

	function renderRowInformation(icon, content){
		let renderedIcon = !!icon ? <Text><Icon  name={icon} marginRight={15}/></Text> : null;

		return (
			<View style={{alignItems: "center", flexDirection: "row", margin: 3}}>
				{renderedIcon}<Text>{content}</Text>
			</View>
		)
	}

	function renderUserBasicInformations(){
		let fullname = user?.first_name+" "+user?.last_name;
		let title = !!user?.title ? ", "+user.title : "";
		let mail = !!user?.email ? user.email : "";
		let id = !!user?.id ? user.id : "";

		return (
			<View style={{flex: 1}}>
				{renderRowInformation("account-circle", <>{fullname}<Text fontWeight={"thin"} italic={true} >{title}</Text></>)}
				{renderRowInformation("email", mail)}
				{renderRowInformation("passport", <Text fontWeight={"thin"} italic={true} >{id}</Text>)}
				{renderUserRole()}
			</View>
		)
	}

	function renderUserAdvancedInformations(){
		let content =
			<TextArea
				h={"500px"}
				value={JSON.stringify(user, null, 4)}
				w={{
					base: "100%",
				}}
			/>

		return(
			<View key={showmore+"renderUserAdvancedInformations"}>
				<TouchableOpacity onPress={() => {
					setShowmore(true);
				}} >
					<Text><Icon  name={"dots-horizontal"}/></Text>
				</TouchableOpacity>
				<MyAlertDialog accept={"OK"} title={"More Informations"} content={content} onClose={() => {setShowmore(false); return false;}} onAccept={() => {setShowmore(false); return false;}} isOpen={showmore} />
			</View>
		)
	}

	function renderUserRole(){
		let roleName = role?.name;

		return renderRowInformation("check-decagram", roleName)
	}

	return(
		<>
			<MyThemedBox _shadeLevel={1} style={{width: "100%"}}>
				<View style={{margin: 20, flexDirection: "row-reverse", alignItems: "center"}}>
					{renderUserAdvancedInformations()}
					<View style={{flexDirection: "row", alignItems: "center", flex: 1}}>
						{renderUserImage()}
						{renderUserBasicInformations()}
					</View>
				</View>
			</MyThemedBox>
		</>
	)
}

Users.displayName = keyof({ Users });

