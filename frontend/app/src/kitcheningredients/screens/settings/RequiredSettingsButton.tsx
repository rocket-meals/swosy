// @ts-nocheck
import React, {FunctionComponent} from 'react';
import {Navigation} from "./../../navigation/Navigation";
import {UserProfileAvatar} from "../../project/UserProfileAvatar";
import {ConfigHolder} from "../../ConfigHolder";
import {MenuItem} from "../../navigation/MenuItem";
import {TranslationKeys} from "../../translations/TranslationKeys";
import {useMyContrastColor} from "../../theme/useMyContrastColor";

export interface AppState{
  backgroundColor?: string
  textColor?: string,
}
export const RequiredSettingsButton: FunctionComponent<AppState> = ({...props}: any) => {

  const headerBackgroundColor = props?.backgroundColor;
  let headerTextColor = props?.textColor;
  if(!headerTextColor){
    headerTextColor = useMyContrastColor(headerBackgroundColor);
  }
  const textColor = headerTextColor

  let user = ConfigHolder.instance.getUser()

  let usedColor = textColor;

  function handleAvatarPress(){
    //Navigation.navigateTo(Users, {id: user.id});
    let menuItem: MenuItem = Navigation.requiredMenuItems[Navigation.DEFAULT_MENU_KEY_SETTINGS];
    Navigation.navigateTo(menuItem?.route?.path);
  }

  const useTranslation = ConfigHolder.plugin.getUseTranslationFunction();
  const accessibilityLabel = useTranslation(TranslationKeys.profile_and_settings);

  return (
    <UserProfileAvatar accessibilityLabel={accessibilityLabel} user={user} color={usedColor} onPress={handleAvatarPress} />
  )
}
