import React, {FunctionComponent} from "react";
import {Markings} from "../../directusTypes/types";
import {useDirectusTranslation} from "../translations/DirectusTranslationUseFunction";
import {Text} from "native-base";
import {useMarkingName} from "./UseMarkingName";

interface AppState {
	marking?: Markings,
}
export const MarkingName: FunctionComponent<AppState> = (props) => {
	let rowContent = useMarkingName(props?.marking);
	return  <Text selectable={true} >{rowContent}</Text>;
}
