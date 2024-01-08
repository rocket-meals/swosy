import React, {FunctionComponent, useEffect, useState} from "react";
import {Input, View} from "native-base";

export const KeyboardAvoidingScrollviewExample: FunctionComponent = (props) => {

	return(
		<View style={{height: "100%", width: "100%"}}>
			<Input key={"1"} placeholder={"Test"}/>
			<View style={{height: 500, width: "100%", backgroundColor: "red"}} />
			<Input key={"2"} placeholder={"Test"}/>
			<View style={{height: 500, width: "100%", backgroundColor: "red"}} />
			<Input key={"3"} placeholder={"Test"}/>
			<View style={{height: 500, width: "100%", backgroundColor: "red"}} />
			<Input key={"4"} placeholder={"Test"}/>
			<View style={{height: 500, width: "100%", backgroundColor: "red"}} />
			<Input key={"5"} placeholder={"Test"}/>
			<View style={{height: 500, width: "100%", backgroundColor: "red"}} />
		</View>
	)
}