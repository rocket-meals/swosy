import {UserItem} from "@directus/sdk";
import {ColorMode, View} from 'native-base';
import {DefaultTranslator} from "./translations/DefaultTranslator";
import {CookieDefaultComponents} from "./screens/legalRequirements/CookieDefaultComponents";
import {CookieDetails, CookieGroupEnum, CookieStorageTypeEnum} from "./screens/legalRequirements/CookieHelper";
import {TranslationKeys} from "./translations/TranslationKeys";
import {SynchedState} from "./synchedstate/SynchedState";
import {RequiredStorageKeys} from "./storage/RequiredStorageKeys";
import React from "react";
import {StringHelper} from "./helper/StringHelper";

export abstract class PluginInterface{

  // @ts-ignore
  constructor(props) {
    StringHelper.enableReplaceAllOnOldDevices() // Android does not support .replaceAll()
  }

  initApp(){

    }
    async registerRoutes(user: UserItem | null, role: any | undefined, permissions: any | undefined){
      return null;
    }

    onLogout(error){

    }
    onLogin(user, role, permissions){

    }

    getSynchedStateKeysClass(){
      return null;
    }
    getStorageKeysClass(){
      return null;
    }

    getLoadingComponent(){
      return null;
    }

    getSyncComponent(){
        return null;
    }

    getAboutUsComponent(){
      return null;
    }

    getLicenseComponent(){
      return null;
    }

    getAccessibilityComponent(){
      return null;
    }

    getCookieDetails(cookieName: string): CookieDetails{
      let translationWe = DefaultTranslator.useTranslation(TranslationKeys.cookie_policy_provider_we);

      let requiredCookiesNames = SynchedState.getRequiredStorageKeys();
      let defaultDetails = {
        name: cookieName,
        provider: translationWe,
        provider_url: undefined,
        purpose: DefaultTranslator.useRequiredStorageKeysPurpose(undefined),
        expiry: DefaultTranslator.useTranslation(TranslationKeys.cookie_policy_details_expiry_persistent),
        type: CookieGroupEnum.Necessary,
        storageType: CookieStorageTypeEnum.LocalStorage,
      }

      for(let requiredCookieName of requiredCookiesNames){
        if(requiredCookieName === cookieName){
          defaultDetails.purpose = DefaultTranslator.useRequiredStorageKeysPurpose(requiredCookieName as RequiredStorageKeys);
          break;
        }
      }
      // Default case
      return defaultDetails;
    }

    getCookieGroupName(cookieGroup: string): string{
      if(cookieGroup === CookieGroupEnum.Necessary){
        return DefaultTranslator.useTranslation(TranslationKeys.cookie_policy_group_necessary);
      }
      return cookieGroup+" (Missing description)";
    }

    getCookieAdditionalGroups(){
      return [];
    }

    getCookieComponentConsent(){
      return CookieDefaultComponents.getCookieComponentConsent()
    }

    getCookieComponentAbout(){
      return CookieDefaultComponents.getCookieComponentAbout()
    }

    getPrivacyPolicyComponent(){
      return null;
    }

    getHomeComponent(){
      return null;
    }

    getSettingsComponent(){
      return null;
    }

    getRootComponent(props){
      return null;
    }

    getRootWrapper(content){
      return content;
    }

    getUseTranslationFunction(){
      return DefaultTranslator.useTranslation;
    }

    getBottomNavbarComponent(){
      return null;
    }

    renderCustomAuthProviders(serverInfo): []{
      return null;
    }

    renderCustomUserAvatar(user: UserItem): JSX.Element{
      return null;
    }

    getOverwriteTheme(): ColorMode {
      return null;
    }

    renderLoginTemplateTopRight(){
      return null;
    }

    renderBaseLayoutContent(content){
      return (
        <View style={{width: "100%", flex: 1, flexDirection: "row"}}>
          {content}
        </View>
      )
    }

    customContrastColor(backgroundColor){
      return null;
    }

    renderCustomProjectLogo({
                              serverInfo,
                              height,
                              width,
                              backgroundColor,
                              borderRadius
                            }): JSX.Element{
      return null;
    }
}
