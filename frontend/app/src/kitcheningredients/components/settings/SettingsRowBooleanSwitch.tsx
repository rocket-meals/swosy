import React, {FunctionComponent, useState} from "react";
import {ConfigHolder} from "../../ConfigHolder";
import {TranslationKeys} from "../../translations/TranslationKeys";
import {SettingsRow, SettingsRowProps} from "./SettingsRow";
import {Layout} from "../../templates/Layout"
import {Switch, Text, View} from "native-base";
import {ViewPixelRatio} from "../ViewPixelRatio";
import {PlatformHelper} from "../../helper/PlatformHelper";
import {AccessibilityRoles} from "../../helper/AccessibilityRoles";

interface AppState {
    value: boolean,
    accessibilityLabel: string,
    onPress?: (nextValue: boolean) => {},
    onTrackColor?: string,
    debug?: boolean,
    disabled?: boolean

}
export const SettingsRowBooleanSwitch: FunctionComponent<AppState & SettingsRowProps> = ({accessibilityLabel,...props}) => {

    const debug = props?.debug

    const [isCheckedRaw, setIsChecked] = useState(props?.value)
    const isChecked = isCheckedRaw===true

    const useTranslation = ConfigHolder.plugin.getUseTranslationFunction();
    const translationSwitch = useTranslation(TranslationKeys.switch);
    const translationDisabled = useTranslation(TranslationKeys.button_disabled);

    let accessibilityLabelWithFunction = accessibilityLabel ? accessibilityLabel+": "+translationSwitch : translationSwitch
    if(props?.disabled){
      accessibilityLabelWithFunction += " ("+translationDisabled+")";
    }

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
        debugContent = (
          <View>
            <Text>{"isChecked: "+JSON.stringify(isChecked)}</Text>
            <Text>{"props?.disabled: "+JSON.stringify(props?.disabled)}</Text>
          </View>
        )
    }

    let rightContent = (
        <ViewPixelRatio style={{paddingRight: 10}}>
            {debugContent}
            <Switch
                    accessibilityRole={AccessibilityRoles.switch}
                    disabled={props?.disabled}
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
        <SettingsRow accessibilityLabel={accessibilityLabelWithFunction} accessibilityRole={"switch"} {...props} rightIcon={rightContent} onPress={onPress} />
    )
}
