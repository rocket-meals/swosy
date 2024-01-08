// @ts-nocheck
import React, {FunctionComponent, useEffect, useState} from 'react';
import ServerAPI from "../ServerAPI";
import {AuthProvider} from "./AuthProvider";
import {View} from "native-base";
import {AuthProviderAnonymous} from "./AuthProviderAnonymous";
import {ConfigHolder} from "./../ConfigHolder";

export const AuthProvidersLoginOptions: FunctionComponent = (props) => {

	const [firstFetch, setfirstFetch] = useState(true)
	const [authProviders, setAuthProviders] = useState(undefined)
	const [reloadnumber, setReloadnumber] = useState(0)
  	const serverInfo = ServerAPI.tempStore.serverInfo;

	async function fetchAuthProviders(){
		try{
			let providers = await ServerAPI.getAuthProviders();
			setAuthProviders(providers);
			setReloadnumber(reloadnumber+1);
		} catch (err){
			console.log(err)
		}
	}

	function renderAuthProvider(provider: any){
		return <AuthProvider key={"externalProvider"+provider?.name} provider={provider} serverInfo={serverInfo} />;
	}

	function renderAuthProviders(){
		let output = [];

    if(!!ConfigHolder.plugin.renderCustomAuthProviders){
      let customProviders = ConfigHolder.plugin.renderCustomAuthProviders(serverInfo);
      if(!!customProviders){
        for(let customProvider of customProviders){
          output.push(customProvider);
        }
      }
    }

			if(!!authProviders){
				for(let provider of authProviders){
					output.push(renderAuthProvider(provider))
				}
			}

		return (
			<View style={{width: "100%"}}>
				{output}
			</View>
		);
	}

	// corresponding componentDidMount
	useEffect(() => {
		fetchAuthProviders();
	}, [])


	return (
		<View style={{width: "100%"}}>
			{renderAuthProviders()}
		</View>
	)
}
