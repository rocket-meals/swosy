// @ts-nocheck
import React, {FunctionComponent} from "react";
import {Icon, RequiredStorageKeys, useSynchedDrawerConfig} from "../../../kitcheningredients";
import {useAppTranslation} from "../translations/AppTranslation";
import {SettingsRowBooleanSwitch} from "./SettingsRowBooleanSwitch";

export const SettingsRowDrawerPosition: FunctionComponent = (props) => {

    let storageKey = RequiredStorageKeys.CACHED_DRAWER_CONFIG;
    const [drawerConfig, setDrawerConfig] = useSynchedDrawerConfig(storageKey);

    const isOritentationLeft = drawerConfig?.drawerPosition === "left";
    let nextOrientation = isOritentationLeft ? "right" : "left";

    const translationOrientation = useAppTranslation("handOrientation");
    const translationLeft = useAppTranslation("left");
    const translationRight = useAppTranslation("right");
    const accessibilityLabel = translationOrientation + " " + (isOritentationLeft ? translationLeft : translationRight);

    let icon = isOritentationLeft ? "arrow-collapse-left" : "arrow-collapse-right";

    let isChecked = !isOritentationLeft

    function handlePress(){
        drawerConfig.drawerPosition = nextOrientation;
        setDrawerConfig({...drawerConfig});
    }

    const leftIcon = <Icon name={icon} />

    return(
        <SettingsRowBooleanSwitch accessibilityLabel={accessibilityLabel} leftIcon={leftIcon} leftContent={translationOrientation} onPress={handlePress} value={isChecked} />
    )
}
