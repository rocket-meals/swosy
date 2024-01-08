// @ts-nocheck
import React, {FunctionComponent} from 'react';

import {Icon} from "../components/Icon";
import {Navigation} from "../navigation/Navigation";
import {ConfigHolder} from "../ConfigHolder";
import {TranslationKeys} from "../translations/TranslationKeys";
import {MyTouchableOpacity} from "../components/buttons/MyTouchableOpacity";
import {useMyContrastColor} from "../theme/useMyContrastColor";
import {View} from "native-base";

export interface AppState{
  color?: string;
  closeDrawer?: boolean
  useTextColor?: boolean
  backgroundColor?: string
  hidden?: boolean
}
export const DrawerButton: FunctionComponent<AppState> = ({color, useTextColor, closeDrawer, ...props}) => {

  let usedColor = color;
  const isHidden = props?.hidden;

  const headerBackgroundColor = props?.backgroundColor;
  if(!usedColor && !!headerBackgroundColor){
    usedColor = useMyContrastColor(headerBackgroundColor);
  }

  const useTranslation = ConfigHolder.plugin.getUseTranslationFunction();
  const accessibilityLabel = useTranslation(TranslationKeys.sidebar_menu);

  function onPress(){
    if(closeDrawer){
      Navigation.drawerClose();
    } else {
      Navigation.drawerToggle();
    }
  }

  let icon = <Icon name={"menu"} color={usedColor} selectable={!isHidden} />;
  if(closeDrawer){
    icon = <Icon name={"close"} color={usedColor} selectable={!isHidden} />;
  }

  if(isHidden){
    return(
        <View
            aria-hidden={isHidden ? "true" : "false"}
            importantForAccessibility={isHidden ? 'no' : 'auto'}
            accessibilityLabel={isHidden ? undefined : "Menu"} style={{padding: 12}} onPress={onPress} >
          {icon}
        </View>
    )
  } else {
    return(
        <MyTouchableOpacity
            aria-hidden={isHidden ? "true" : "false"}
            importantForAccessibility={isHidden ? 'no' : 'auto'}
            accessibilityLabel={isHidden ? undefined : "Menu"} style={{padding: 12}} onPress={onPress} >
          {icon}
        </MyTouchableOpacity>
    )
  }
};
