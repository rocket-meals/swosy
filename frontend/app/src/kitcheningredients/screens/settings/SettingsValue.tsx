// @ts-nocheck
import React, {FunctionComponent, useEffect, useState} from "react";
import {Button, Input, Pressable, Text, TextArea, View} from "native-base";
import {MyThemedBox} from "../../helper/MyThemedBox";

export interface AppState {
	storageKey?: any;
	value?: any;
	setValue?: any;
	readOnly?: boolean
}
export const SettingsValue: FunctionComponent<AppState> = (props) => {

	const [text, setText] = React.useState(props.value)

	// corresponding componentDidMount
	useEffect(() => {

	}, [])

	const handleChange = (event: any) => setText(event.target.value)

	function renderValue(){
		if(props.readOnly){
			return(
				<Text>{text}</Text>
			)
		} else {
			return(
			<>
				<Input
					value={text}
					w={"100%"}
					onChange={handleChange}
					placeholder="Value Controlled Input"
				/>
				<Button onPress={() => {
					props.setValue(text);
				}} >{"Change"}</Button>
			</>
			)
		}
	}

	return(
		<>
			<MyThemedBox style={{margin: 5, padding: 5}} _shadeLevel={2} >
				<Text>{props.storageKey}</Text>
				{renderValue()}
			</MyThemedBox>
		</>
	)
}
