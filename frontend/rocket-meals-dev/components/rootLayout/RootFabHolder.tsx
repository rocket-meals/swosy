import React from 'react';
import {
    MyColorSchemeKey, useIsDarkTheme,
    useMyColorSchemeKeySavedOption
} from "@/helper/sync_state_helper/custom_sync_states/ColorScheme";
import {Icon, View} from "@/components/Themed";
import {MyFab} from "@/components/fab/MyFab";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export interface RootFabHolderProps {
    children?: React.ReactNode;
}
export const RootFabHolder = (props: RootFabHolderProps) => {
    let [savedColorSchemeOptionRaw, setColorSchemeOptionRaw] = useMyColorSchemeKeySavedOption()
    let isDarkMode = useIsDarkTheme()

  return(
      <View style={{position: "absolute", bottom: 0, right: 0}}>
            {/* Render the children */}
            {props?.children}
          <MyFab style={{backgroundColor: "red"}} accessibilityLabel={"themeSwitcher"} onPress={() => {
              if(isDarkMode) {
                  setColorSchemeOptionRaw(MyColorSchemeKey.Light)
              } else {
                  setColorSchemeOptionRaw(MyColorSchemeKey.Dark)
              }
          }}>
             <Icon name={"theme-light-dark"} size={24} />
              </MyFab>
      </View>
  )
}