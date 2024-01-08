// @ts-nocheck
import React, {FunctionComponent} from 'react';
import {AuthProvider} from "./AuthProvider";
import {Provider} from "./Provider";
import {ConfigHolder} from "../ConfigHolder";
import {Navigation} from "./../navigation/Navigation";
import {TranslationKeys} from "../translations/TranslationKeys";
import ServerAPI from "../ServerAPI";
import {MyActionsheet} from "../helper/MyActionsheet";

interface AppState {
	loading?: boolean,
}

export const AuthProviderAnonymous: FunctionComponent<AppState> = () => {
  const serverInfo = ServerAPI.tempStore.serverInfo;

  const actionsheet = MyActionsheet.useActionsheet();

	let provider: Provider = {
		name: "Guest",
		icon: "incognito-circle"
	};

  const useTranslation = ConfigHolder.plugin.getUseTranslationFunction();
  const translation_continue_as_guest = useTranslation(TranslationKeys.continue_as_anonymous);

  async function handleContinue(){
    await ConfigHolder.instance.setUserAsAnonymous();
    await ConfigHolder.instance.setHideDrawer(false, Navigation.DEFAULT_ROUTE_HOME);
  }

	async function handleOpened(){
    let callbackBefore = ConfigHolder?.authConfig?.anonymous?.callbackBefore;
    if(!!callbackBefore){
      await callbackBefore(handleContinue, actionsheet)
    } else {
      await handleContinue();
    }
	}

	return (
		<AuthProvider serverInfo={serverInfo} provider={provider} buttonText={translation_continue_as_guest} callback={handleOpened} />
	)
}
