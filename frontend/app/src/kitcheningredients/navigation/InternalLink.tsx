// @ts-nocheck
import React, {FunctionComponent} from 'react';
import {Text} from "native-base";
import {IButtonProps} from "native-base/src/components/primitives/Button/types";
import {IBoxProps} from "native-base/src/components/primitives/Box/index";
import {TransparentButton} from "../components/buttons/TransparentButton";
import {Navigation} from "./Navigation";

interface AppState {
	destination: FunctionComponent;
	fontSize?: string;
	beforeNavigateCallback?: () => {}
	afterNavigateCallback?: () => {}
}
export const InternalLink: FunctionComponent<IButtonProps & IBoxProps & AppState> = (props) => {

	let content = props.children;
	let beforeNavigateCallback = props.beforeNavigateCallback;
	let afterNavigateCallback = props.afterNavigateCallback;

	return (
		<TransparentButton accessibilityLabel={props?.accessibilityLabel} onPress={async () => {
			if(!!beforeNavigateCallback){
				await beforeNavigateCallback();
			}
			Navigation.navigateTo(props.destination);
			if(!!afterNavigateCallback){
				await afterNavigateCallback();
			}
		}} {...props}>
			<Text {...props} underline={true} fontSize={props.fontSize}>
				{content}
			</Text>
		</TransparentButton>
	)
}
