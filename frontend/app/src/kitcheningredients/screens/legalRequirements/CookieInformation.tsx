// @ts-nocheck
import React, {FunctionComponent, useState} from "react";
import {ConfigHolder} from "../../ConfigHolder";
import {RequiredSynchedStates} from "../../synchedstate/RequiredSynchedStates";
import {useSynchedCookieConfig, useSynchedJSONState} from "../../synchedstate/SynchedState";
import {CookieInformationInner} from "./CookieInformationInner";

interface AppState {
  autoOpenCookies?: boolean;
}
export const CookieInformation: FunctionComponent<AppState> = ({autoOpenCookies, ...props}) => {

  if(!ConfigHolder.useCookiePolicy){
    return null;
  }

  let [isOpen, setIsOpen] = useSynchedJSONState(RequiredSynchedStates.showCookies)
  const date_cookie_policy_updated = undefined;
  const [cookieConfig, setCookieConfig] = useSynchedCookieConfig();
  const date_consent = cookieConfig?.date_consent;

  function cookieConsentUpToDate(){
    if(!cookieConfig || !date_consent){
      return false;
    } else {
      let isUpToDate = true;
      if(!!date_cookie_policy_updated){
        if(!!date_consent){
          if(new Date(date_consent) < new Date(date_cookie_policy_updated)){
            isUpToDate = false;
          }
        }
      }

      return isUpToDate;
    }
  }

  if(!cookieConsentUpToDate() && autoOpenCookies!==false){
    isOpen = true;
  }

  if(isOpen){
    return <CookieInformationInner />
  } else {
    return null;
  }

}
