import React, {FunctionComponent, useState} from "react";
import {SettingsRow, SettingsRowProps} from "./SettingsRow";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {View, Text} from "@/components/Themed";
import {ViewWithPercentageSupport} from "@/components/ViewWithPercentageSupport";
import {Switch} from "@gluestack-ui/themed";
import {PlatformHelper} from "@/helper/PlatformHelper";

interface AppState {
    value: boolean,
    accessibilityLabel: string,
    onPress?: (nextValue: boolean) => void,
    onTrackColor?: string,
    debug?: boolean,
    disabled?: boolean

}
export const SettingsRowBooleanSwitch: FunctionComponent<AppState & SettingsRowProps> = ({accessibilityLabel,...props}) => {

    const debug = props?.debug

    const [isCheckedRaw, setIsChecked] = useState(props?.value)
    const isChecked = isCheckedRaw===true

    const translationSwitch = useTranslation(TranslationKeys.switch);
    const translationDisabled = useTranslation(TranslationKeys.button_disabled);

    let accessibilityLabelWithFunction = accessibilityLabel ? accessibilityLabel+": "+translationSwitch : translationSwitch
    if(props?.disabled){
      accessibilityLabelWithFunction += " ("+translationDisabled+")";
    }

    function onPress(){
        const nextValue = !isChecked;
        if(nextValue){
            setIsChecked(true);
        } else {
            setIsChecked(false);
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
        <ViewWithPercentageSupport style={{paddingRight: 10}}>
            {debugContent}
            <Switch
                    size={"md"}
                    value={isChecked}
                    disabled={props?.disabled}
                    isChecked={isChecked}
                    onToggle={() => {
                        if(PlatformHelper.isWeb()){
                            //do nothing since, the touchable opacity overlays it on web and would trigger twice
                        } else {
                            onPress();
                        }
                    }}  />
        </ViewWithPercentageSupport>
    )

    return(
        <SettingsRow accessibilityLabel={accessibilityLabelWithFunction} accessibilityRole={"switch"} {...props} rightIcon={rightContent} onPress={onPress} />
    )
}
