// @ts-nocheck
import React, {FunctionComponent, useEffect, useState} from 'react';
import {Flex, FormControl, Input, Text, View} from "native-base";
import {Login} from "./Login";
import {FormButton} from "../components/buttons/FormButton";
import {InternalLink} from "../navigation/InternalLink";

export const ResetPasswordForm: FunctionComponent = (props) => {

	const token=props.token;
	let email = "yourEmail";

	const [resetInitiated, setResetInitiated] = useState(false)
	const [password, setPassword] = useState("")

	// corresponding componentDidMount
	useEffect(() => {

	}, [p])

	function resetPassword(){

	}

	return (
		<View>
			<Text fontSize="2xl" fontWeight={800}>
				{"Reset Password"}
			</Text>
			<FormControl isRequired>
				<View style={{marginVertical: 10}}>
					<Input
						isDisabled={true}
						value={email}
						size="lg" />
				</View>
			</FormControl>
			<FormControl isRequired>
				<View style={{marginVertical: 10}}>
					<Input
						isDisabled={resetInitiated}
						onChange={(event) => { // @ts-ignore
							setPassword(event.target.value)}}
						type="password"
						value={password}
						placeholder="Password"
						size="lg" />
				</View>
			</FormControl>
			<Flex flexDirection={"row"} justify={"space-between"}>
				<FormButton loading={resetInitiated} disabled={resetInitiated} onPress={() => {resetPassword()}}>
					{"Reset"}
				</FormButton>
				<InternalLink destination={Login}>{"Sign In"}</InternalLink>
			</Flex>
		</View>
	)
}
