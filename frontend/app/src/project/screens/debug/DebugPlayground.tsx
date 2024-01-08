import React, {useEffect, useState} from "react";
import {Actionsheet, Button, Divider, Input, ScrollView, Spacer, Text, useDisclose, useToast, View} from "native-base";
import {MyActionsheet} from "../../../kitcheningredients";
import {AppTranslation} from "../../components/translations/AppTranslation";

export const DebugPlayground = (props) => {

	const actionsheet = MyActionsheet.useActionsheet();

	return(
		<View style={{width: "100%"}}>
			<Text>DebugPlayground</Text>
			<Button	onPress={() => {
				actionsheet.show({
					title: "Title",
					acceptLabel: <AppTranslation id={"accept"} />,
					cancelLabel: <AppTranslation id={"cancel"} />,
					onAccept: () => {
						//console.log("accept");
						actionsheet.show({
							title: "Next Menu",
							acceptLabel: "Only Accept given",
							onAccept: () => {
								//console.log("accept 2");
							},
						});
					},
					onCancel: () => {
						//console.log("Cancel");
					}
				});
			}}>Toastsheet</Button>
		</View>
	)
}
