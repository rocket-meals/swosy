// @ts-nocheck
import React, {FunctionComponent, useEffect, useRef, useState} from "react";
import {Input, Text, View} from "native-base";
import {Icon, useThemeTextColor} from "../../../kitcheningredients";
import {SettingsRow} from "../../components/settings/SettingsRow";
import {ParentSpacer} from "../../helper/ParentSpacer";
import {MyButton} from "../buttons/MyButton";
import {useAppTranslation} from "../translations/AppTranslation";
import {AccessibilityRoles} from "../../../kitcheningredients/helper/AccessibilityRoles";

interface AppState {
    icon?: any;
    initialValue?: string;
    description?: string;
    placeholder?: string;
    onChange?: (value: string) => boolean;
    saveText?: string;
    cancelText?: string;
}

//TODO use SettingsRowTextEditComponent as base
export const SettingsRowTimeEditComponent: FunctionComponent<AppState> = (props) => {

    const textColor = useThemeTextColor();
    const [editText, setEditText] = useState(false);
    const [loading, setLoading] = useState(false);
    const initialValue = props.initialValue || "";
    const description = props.description || "";
    const [textValue, textTextValue] = useState(initialValue);
    const textInput = useRef(null);

    let translationEdit = useAppTranslation("edit") || "";
    // capitalise first letter
    translationEdit = translationEdit.charAt(0).toUpperCase() + translationEdit.slice(1);

    //load user with corresponding profile?

    // corresponding componentDidMount
    useEffect(() => {
        if(editText){
            textInput.current.focus()
        }
    }, [props?.route?.params, editText])

    function checkAndFormatInput(text){
        //check if input is valid time format (hh:mm) and format it
        let time = text.split(":");
        if(time.length == 1){
            let hours = time[0];
            if(hours.length > 2){
                hours = hours.substring(0,2);
            }
            text = hours + ":00";
        }
        time = text.split(":");
        if(time.length == 2){
            //check if hours and minutes are numbers
            if(!isNaN(time[0]) && !isNaN(time[1])){
                //check if hours and minutes are in range
                if(time[0] >= 0 && time[0] <= 23 && time[1] >= 0 && time[1] <= 59){
                    //format time and add leading zeros
                    let hours = ("0" + time[0]).slice(-2);
                    let minutes = ("0" + time[1]).slice(-2);
                    return hours + ":" + minutes;
                }
            }
        }
        return false;
    }

    async function handleSave() {
        //console.log("ROW: save")
        let formattedTime = checkAndFormatInput(textValue);
        if(formattedTime){
            textTextValue(formattedTime);
            let success = await props.onChange(formattedTime);
            //console.log("ROW: save success: " + success)
            if(success) {
                setEditText(false);
            }
        } else {
            textTextValue("00:00");
        }
        setLoading(false);
    }

    // corresponding componentDidMount
    useEffect(() => {
        if(loading){
            handleSave();
        }
    }, [loading])

    function renderContent(){
        let textPlaceholder = <View style={{flexDirection: "row", alignItems: "center"}}><Text>{initialValue}</Text></View>;
        let displayStyle = "none";
        if(editText) {
            textPlaceholder = null;
            displayStyle = null;
        }

        let saveEnabled = textValue.length > 0 && textValue !== initialValue && !loading;

        return(
            <View style={{width: "100%", alignItems: "flex-end"}}>
                {textPlaceholder}
                <View style={{display: displayStyle, width: "100%"}}>
                    <Input ref={textInput}

                           _input={{ // https://github.com/GeekyAnts/NativeBase/issues/5420
                               selectionColor: textColor,
                               placeholderTextColor: textColor,
                               // @ts-ignore
                               cursorColor: textColor,
                           }}

                           placeholder={props?.placeholder} value={textValue} onChangeText={(text) => {textTextValue(text)}}/>
                    <ParentSpacer space={10} style={{marginTop: 20, width: "100%", flex: 1, flexDirection: "row", flexWrap: "wrap"}}>
                        <MyButton accessibilityLabel={props?.saveText} disabled={!saveEnabled} onPress={async () => {
                            if(!!props.onChange){
                                setLoading(true);
                            } else {
                                //TODO: error handling
                            }
                        }}
                            iconName={"content-save"}
                            label={props?.saveText}
                        >
                        </MyButton>
                        <MyButton accessibilityLabel={props?.cancelText} disabled={loading} onPress={() => {
                                setEditText(false);
                                textTextValue(initialValue);
                        }}
                            iconName={"cancel"}
                                  label={props?.cancelText}
                        >
                        </MyButton>
                    </ParentSpacer>
                </View>
            </View>
        )
    }

  return (
          <SettingsRow accessibilityRole={AccessibilityRoles.adjustable} accessibilityLabel={translationEdit+": "+description} onPress={editText ? undefined : () => {if(!editText) {setEditText(!editText)}}} leftContent={description} rightContent={renderContent()} leftIcon={props?.icon} />
  )
}
