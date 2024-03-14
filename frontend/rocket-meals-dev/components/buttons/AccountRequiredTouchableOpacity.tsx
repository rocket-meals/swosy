import React from "react";
import {useIsCurrentUserAnonymous, useLogoutCallback} from "@/states/User";
import {MyGlobalActionSheetConfig, useMyGlobalActionSheet} from "@/components/actionsheet/MyGlobalActionSheet";
import {NotAllowed} from "@/compositions/animations/NotAllowed";
import {MyButton} from "@/components/buttons/MyButton";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {Text, View} from "@/components/Themed";
import {MyTouchableOpacity} from "@/components/buttons/MyTouchableOpacity";


export type AccountRequiredTouchableOpacityProps = {
	children: React.ReactNode,
}
export const AccountRequiredTouchableOpacity = ({children}: AccountRequiredTouchableOpacityProps) => {
	const isAnonymous = useIsCurrentUserAnonymous()
	const [show, hide, showActionsheetConfig] = useMyGlobalActionSheet()
	const logout = useLogoutCallback()

	const translation_no_permission = useTranslation(TranslationKeys.no_permission);
	const translation_please_create_an_account = useTranslation(TranslationKeys.please_create_an_account);
	const translation_create_account = useTranslation(TranslationKeys.create_account);

	const title = translation_no_permission

	const accessiblityLabel = translation_no_permission+". "+translation_please_create_an_account+"."

	const config: MyGlobalActionSheetConfig = {
		visible: true,
		title: title,
		renderCustomContent: () => {
			return(
				<View>
					<NotAllowed />
					<View style={{
						width: "100%",
						paddingBottom: 20,
					}}>
						<Text>{translation_please_create_an_account+"."}</Text>
					</View>
					<MyButton accessibilityLabel={translation_create_account} tooltip={translation_create_account} text={translation_create_account} onPress={() => {
						logout()
						hide()
					}} />
				</View>
			)
		}
	}

	if(isAnonymous) {
		return <TouchableOpacityIgnoreChildEvents
			accessibilityLabel={accessiblityLabel}
			tooltip={accessiblityLabel}
			style={{}}
			useDefaultOpacity={true}
			onPress={() => {
				show(config);
			}}>
			{children}
		</TouchableOpacityIgnoreChildEvents>
	}
	return <>{children}</>
}


export type TouchableOpacityIgnoreChildEventsProps = {
	tooltip: string,
	accessibilityLabel: string,
	onPress?: () => void,
	style?: any,
	useDefaultOpacity?: boolean,
	children: React.ReactNode,
}
export const TouchableOpacityIgnoreChildEvents = ({tooltip, accessibilityLabel, onPress, style, useDefaultOpacity,children, ...props}: TouchableOpacityIgnoreChildEventsProps) => {
	const opacity = useDefaultOpacity ? 0.3 : 1;

	let isStyleArray = Array.isArray(style);
	const opacityStyle = {opacity: opacity};
	let mergedStyle = {...opacityStyle, ...style };
	if(isStyleArray){
		mergedStyle = [opacityStyle ,...style];
	}

	return(
		<MyTouchableOpacity accessibilityLabel={accessibilityLabel} tooltip={tooltip} {...props} style={mergedStyle} onPress={() => {
			if(onPress){
				onPress();
			}
		}}>
			<View pointerEvents={"none"}>
				{children}
			</View>
		</MyTouchableOpacity>
	)

}