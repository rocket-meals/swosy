import React, {FunctionComponent, useState} from "react";
import {Layout, useSynchedJSONState} from "../../../kitcheningredients";
import {SettingsRow, SettingsRowProps} from "./SettingsRow";
import {Switch, View, Text} from "native-base";
import {ViewPixelRatio} from "../../helper/ViewPixelRatio";
import {PlatformHelper} from "../../helper/PlatformHelper";
import {useAppTranslation} from "../translations/AppTranslation";
import {useDebugMode} from "../../helper/synchedJSONState";
import {AccessibilityRoles} from "../../../kitcheningredients/helper/AccessibilityRoles";

interface AppState {
    value: boolean,
    accessibilityLabel: string,
    onPress?: any,
}
export const SettingsRowBooleanSwitch: FunctionComponent<AppState & SettingsRowProps> = ({accessibilityLabel,...props}) => {

    const [debug, setDebug] = useDebugMode()

    const [isCheckedRaw, setIsChecked] = useState(props?.value)
    const isChecked = isCheckedRaw===true

    const translationSwitch = useAppTranslation("switch");
    const accessibilityLabelWithFunction = accessibilityLabel ? accessibilityLabel+": "+translationSwitch : translationSwitch

    let smallDevice = Layout.usesSmallDevice();
    let size = smallDevice ? "md" : "lg"

    function onPress(){
        const nextValue = !isChecked;
        if(nextValue){
            setIsChecked(true);
        } else {
            setIsChecked(null);
        }
        if(!!props.onPress){
            props.onPress(nextValue);
        }
    }

    let debugContent = null;
    if(debug){
        debugContent = <View><Text>{JSON.stringify(isChecked)}</Text></View>
    }

    let rightContent = (
        <ViewPixelRatio style={{paddingRight: 10}}>
            {debugContent}
            <Switch
                accessibilityRole={AccessibilityRoles.switch}
                    size={size}
                    onTrackColor={props?.onTrackColor}
                    isChecked={isChecked}
                    onToggle={() => {
                        if(PlatformHelper.isWeb()){
                            //do nothing since, the touchable opacity overlays it on web
                        } else {
                            onPress();
                        }
                    }}  />
        </ViewPixelRatio>
    )

    return(
        <SettingsRow accessibilityState={{checked: isChecked}} accessibilityLabel={accessibilityLabelWithFunction} accessibilityRole={AccessibilityRoles.switch} {...props} rightIcon={rightContent} onPress={onPress} />
    )
}
