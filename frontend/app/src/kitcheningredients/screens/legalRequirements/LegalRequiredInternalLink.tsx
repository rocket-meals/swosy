// @ts-nocheck
import React, {FunctionComponent} from "react";
import {InternalLink} from "../../navigation/InternalLink";
import {MenuItem} from "../../navigation/MenuItem";
import {Navigation} from "../../navigation/Navigation";
import {View} from "native-base";
import {RequiredSynchedStates} from "../../synchedstate/RequiredSynchedStates";
import {useSynchedJSONState, useSynchedState} from "../../synchedstate/SynchedState";

interface AppState {
  requiredMenuKey?: string;
}
export const LegalRequiredInternalLink : FunctionComponent<AppState> = (props) => {

  let requiredMenuKey = props?.requiredMenuKey;
  let menuItem: MenuItem = Navigation.requiredMenuItems[requiredMenuKey];
  let label = menuItem?.label;

  let [isOpen, setIsOpen] = useSynchedJSONState(RequiredSynchedStates.showCookies)

  return (
    <View>
      <InternalLink beforeNavigateCallback={() => {
        setIsOpen(false) // close the cookie banner when navigating to a legal page
      }} accessibilityLabel={label} destination={menuItem?.route?.path} fontSize={"sm"}>{label}</InternalLink>
    </View>
  )

  //
}
