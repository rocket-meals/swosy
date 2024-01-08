import React, {FunctionComponent} from "react";
import {useAppTranslation} from "../translations/AppTranslation";
import {MyButton} from "./MyButton";
import {ReloadIcon} from "../icons/ReloadIcon";

export interface AppState{
	onPress?: () => Promise<boolean | undefined>, // an async onPress function that returns a boolean or undefined
	disabled?: boolean,
}
export const MyReloadButton: FunctionComponent<AppState> = (props) => {

	const translationReload = useAppTranslation("reload");

	return <MyButton accessibilityLabel={translationReload} label={translationReload} onPress={props?.onPress} renderIcon={(backgroundColor, textColor) => {
		return <ReloadIcon color={textColor} />
	}} >
	</MyButton>

}
