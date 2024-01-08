// @ts-nocheck
import React, {FunctionComponent} from "react";
import {useColorMode} from "native-base";
import {Ionicons} from "@expo/vector-icons";
import {Icon, RequiredStorageKeys, useSynchedJSONState, useSynchedState} from "../../../kitcheningredients";
import {AppTranslation, useAppTranslation} from "../translations/AppTranslation";
import {SettingsRowBooleanSwitch} from "./SettingsRowBooleanSwitch";

export const SettingsRowThemeSwitch: FunctionComponent = (props) => {

    let storageKey = RequiredStorageKeys.CACHED_THEME;
    const [value, setValue] = useSynchedState(storageKey);
    const { colorMode, toggleColorMode } = useColorMode();

    const isLightTheme = colorMode === "light";
    let nextTheme = isLightTheme ? "dark" : "light";

    const translationTheme = useAppTranslation("theme");
    const translationLight = useAppTranslation("light");
    const translationDark = useAppTranslation("dark");
    const accessibilityLabel = translationTheme + " " + (isLightTheme ? translationLight : translationDark);

    let isLight = colorMode==="light"
    let icon = isLight ? "sunny" : "moon";
    let color = isLight ? '#FFF7ED' : '#0F172A';
    let iconColor = isLight ? '#FB923C' : '#F1F5F9';

    let isChecked = !isLight

    function handlePress(){
        setValue(nextTheme)
        toggleColorMode();
    }

    const leftIcon = <Icon name={icon} as={Ionicons} color={iconColor} />

    return(
        <SettingsRowBooleanSwitch accessibilityLabel={accessibilityLabel} color={color} leftIcon={leftIcon} leftContent={<AppTranslation id={"theme"} />} onPress={handlePress} value={isChecked} />
    )
}
