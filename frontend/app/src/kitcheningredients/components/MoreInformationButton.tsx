// @ts-nocheck
import React, {useEffect, useState} from "react";
import {Text, TextArea, View} from "native-base";

import {TouchableOpacity} from "react-native";
import {MyAlertDialog} from "../helper/MyAlertDialog";
import {Icon} from "./Icon";

export const MoreInformationButton= (props) => {

	const [showmore, setShowmore] = useState(props.showmore || false);

	// corresponding componentDidMount
	useEffect(() => {

	}, [])

	function renderAdvancedInformations(){
		let content =
			<TextArea
				h={"500px"}
				value={JSON.stringify(props.content, null, 4)}
				w={{
					base: "100%",
				}}
			/>

		return(
			<View key={""+showmore+props.key}>
				<TouchableOpacity onPress={() => {
					setShowmore(true);
				}} >
					<Text><Icon  name={props.icon || "dots-horizontal"}/></Text>
				</TouchableOpacity>
				<MyAlertDialog size={"full"} accept={"OK"} title={"More Informations"} content={content} onClose={() => {setShowmore(false); return false;}} onAccept={() => {setShowmore(false); return false;}} isOpen={showmore} />
			</View>
		)
	}

	return renderAdvancedInformations()
}
