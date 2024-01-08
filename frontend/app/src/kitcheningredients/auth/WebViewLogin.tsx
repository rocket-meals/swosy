// @ts-nocheck
import React, {FunctionComponent, useEffect} from 'react';
import {Divider, Flex, Spinner, Text, View} from "native-base";
import {FormButton} from "../components/buttons/FormButton";
import {UserItem} from "@directus/sdk";
import {SignOutButton} from "./SignOutButton";
import {EmailLogin} from "./EmailLogin";
import {AuthProvidersLoginOptions} from "./AuthProvidersLoginOptions";
import {ConfigHolder} from "../ConfigHolder";
import {TranslationKeys} from "../translations/TranslationKeys";
import {AuthProviderAnonymous} from "./AuthProviderAnonymous";

export interface WebViewLoginFormState {
	user?: UserItem;
	refresh: () => void,
	loaded: boolean,
  handleContinue: any
}
export const WebViewLogin: FunctionComponent<WebViewLoginFormState> = (props) => {

  const useTranslation = ConfigHolder.plugin.getUseTranslationFunction();
  const translation_sign_in = useTranslation(TranslationKeys.sign_in);
  const translation_continue = useTranslation(TranslationKeys.continue);
  const translation_is_currently_authenticated_remember_this_account = useTranslation(TranslationKeys.is_currently_authenticated_remember_this_account);

	// corresponding componentDidMount
	useEffect(() => {

	}, [props])

	function renderSignInText(){
		return(
			<View>
				<Text fontSize="2xl" fontWeight={800}>
					{translation_sign_in}
				</Text>
			</View>
		)
	}

  function renderLoading(){
    return(
      <View style={{flex: 1}}>
        <View style={{marginVertical: 20}}></View>
        <Spinner />
        <View style={{marginVertical: 20}}></View>
      </View>
    )
  }

  function renderRememberThisAccount(user){
    let identifier = user.email || user.first_name;
    return(
      <View style={{flex: 1}}>
        <View style={{marginVertical: 20}}></View>
        <Text><Text bold={true} >{identifier}</Text> {translation_is_currently_authenticated_remember_this_account}</Text>
        <View style={{marginVertical: 20}}></View>
        <Flex flexDirection={"row"} justify={"space-between"}>
          <SignOutButton />
          <FormButton onPress={async () => {
            await props.handleContinue();
            //
          }}>
            {translation_continue}
          </FormButton>
        </Flex>
      </View>
    )
  }

  function renderLoginOptions() {
    const loginOptions = [];

    // Push Mail login option
    if (ConfigHolder?.authConfig?.mail?.visible) {
      loginOptions.push({
        position: ConfigHolder?.authConfig?.mail?.position || 0,
        component: (
          <>
            <View style={{ marginVertical: 20 }}>
              <Divider />
            </View>
            <EmailLogin />
            <View style={{ marginVertical: 20 }}>
              <Divider />
            </View>
          </>
        )
      });
    }

    // Push Anonymous login option
    if (ConfigHolder?.authConfig?.anonymous?.visible) {
      loginOptions.push({
        position: ConfigHolder?.authConfig?.anonymous?.position || 0,
        component: <AuthProviderAnonymous key={"guest"} />
      });
    }

    // Push External login option
    if (ConfigHolder?.authConfig?.external?.visible) {
      loginOptions.push({
        position: ConfigHolder?.authConfig?.external?.position || 0,
        component: <AuthProvidersLoginOptions />
      });
    }

    // Sort login options by their position
    loginOptions.sort((a, b) => a.position - b.position);

    // Render sorted login options
    let rendered = [];
    loginOptions.map((option, index) => (
      rendered.push(option.component)
    ))

    return (rendered);
  }


  function renderLoginInformations(){
		let user = props.user;
		if(!props.loaded){
			return renderLoading();
		}
		if(!!user){
		  if(!!user.isGuest){
        return renderRememberThisAccount(user);
		  } else {
        return renderRememberThisAccount(user);
      }
		} else {
			return renderLoginOptions();
		}
	}

	return (
		<>
			{renderSignInText()}
      <View style={{height: 24}}></View>
			{renderLoginInformations()}
		</>
	)
}
