import React from 'react';
import {
    MyColorSchemeKey, useIsDarkTheme,
    useMyColorSchemeKeySavedOption
} from "@/states/ColorScheme";
import {Icon, View} from "@/components/Themed";
import {MyFab} from "@/components/fab/MyFab";
import {useIsDevelop} from "@/states/Develop";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export interface RootFabHolderProps {
    children?: React.ReactNode;
}

const DevelopThemeSwitch = () => {
    let [savedColorSchemeOptionRaw, setColorSchemeOptionRaw] = useMyColorSchemeKeySavedOption()
    let isDarkMode = useIsDarkTheme()

    return(
        <MyFab key={"develop-theme-switch"} style={{backgroundColor: "red"}} accessibilityLabel={"themeSwitcher"} onPress={() => {
            if(isDarkMode) {
                setColorSchemeOptionRaw(MyColorSchemeKey.Light)
            } else {
                setColorSchemeOptionRaw(MyColorSchemeKey.Dark)
            }
        }}>
            <Icon name={"theme-light-dark"} size={24} />
        </MyFab>
    )
}

export const RootFabHolder = (props: RootFabHolderProps) => {

        const isDevelopMode = useIsDevelop();

        const developHelperComponents = []
    if(isDevelopMode){
        developHelperComponents.push(<DevelopThemeSwitch />)
    }

  return(
      <View style={{position: "absolute", bottom: 0, right: 0}}>
            {/* Render the children */}
            {props?.children}
          {developHelperComponents}
      </View>
  )
}