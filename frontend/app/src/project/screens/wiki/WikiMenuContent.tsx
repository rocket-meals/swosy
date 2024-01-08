import React, {FunctionComponent, useEffect, useState} from "react";
import {Wikis} from "../../directusTypes/types";
import {Text, View} from "native-base";
import {useDirectusTranslation} from "../../components/translations/DirectusTranslationUseFunction";

interface AppState {
	wiki?: Wikis,
}
export const WikiMenuContent: FunctionComponent<AppState> = (props) => {
		const wiki = props?.wiki;
		const translations = wiki?.translations;
		const title = useDirectusTranslation(translations, "title") || "Loading";

		return (
			<View style={{width: "100%"}}>
				<Text fontSize={"md"}>{title}</Text>
			</View>
		);
}