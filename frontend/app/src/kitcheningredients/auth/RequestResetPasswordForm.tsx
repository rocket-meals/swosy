// @ts-nocheck
import React, {FunctionComponent, useEffect, useState} from 'react';
import {Flex, FormControl, Input, Text, View} from "native-base";
import {Login} from "./Login";
import {FormButton} from "../components/buttons/FormButton";
import ServerAPI from "../ServerAPI";
import {URL_Helper} from "../helper/URL_Helper";
import {InternalLink} from "../navigation/InternalLink";

export const RequestResetPasswordForm: FunctionComponent = (props) => {

	const [email, setEmail] = useState("")
	const [validEmail, setValidEmail] = useState(undefined)
	const [resetInitiated, setResetInitiated] = useState(false)

	// corresponding componentDidMount
	useEffect(() => {

	}, [])

	async function requestPasswordReset(){
		console.log("requestPasswordReset");
		if(!resetInitiated){
			await setResetInitiated(true);
			try{
				console.log("Send reset request");
				let directus = ServerAPI.getPublicClient();
				let url = URL_Helper.getCurrentLocationWithoutQueryParams();
				url = "https://localhost:19006/myapp/app/reset-password";
				let answer = await directus.auth.password.request(
					email,
					url // In this case, the link will be https://myapp.com?token=FEE0A...
				);
			} catch (err){
				console.log(err);
			} finally {
				await setResetInitiated(false);
			}
		}
	}

	return (
		<View>
			<Text fontSize="2xl" fontWeight={800}>
				{"Reset Password"}
			</Text>
			<FormControl isRequired>
				<View style={{marginVertical: 10}}>
					<Input
						onChange={(event) => { // @ts-ignore
							setEmail(event.target.value)}}
						type="email"
						value={email}
						placeholder="Email"
						size="lg" />
				</View>
			</FormControl>
			<Flex flexDirection={"row"} justify={"space-between"}>
				<FormButton disabled={resetInitiated} onPress={() => {requestPasswordReset()}}>
					{"Reset"}
				</FormButton>
				<InternalLink destination={Login}>{"Sign In"}</InternalLink>
			</Flex>
		</View>
	)
}
