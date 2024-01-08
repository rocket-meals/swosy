// @ts-nocheck
import React, {FunctionComponent} from 'react';
import {Button, HStack, Spinner} from "native-base";
import {IButtonProps} from "native-base/src/components/primitives/Button/types";
import {IBoxProps} from "native-base/src/components/primitives/Box/index";

interface AppState {
	loading?: boolean;
}

export const FormButton: FunctionComponent<AppState & IButtonProps & IBoxProps> = (props) => {

	let loading = props.loading;

	function getLoadingContent(){
		return(
			<HStack space={2} alignItems="center">
				<Spinner accessibilityLabel="Loading posts" />
			</HStack>
		);
	}

	let content = props.children;
	if(loading){
		content = getLoadingContent();
	}

	return (
		//use inline style for backgroundColor ! Weird bug if pressing a button otherwise
		<Button borderColor={"#00000000"} minWidth={154} {...props}>
			{content}
		</Button>
	)
}