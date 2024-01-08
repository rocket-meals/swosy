// @ts-nocheck
import React, {FunctionComponent, useEffect, useRef, useState} from "react";
import {Input, Text, View} from "native-base";
import {Icon, useThemeTextColor} from "../../../kitcheningredients";
import {SettingsRow} from "../../components/settings/SettingsRow";
import {ParentSpacer} from "../../helper/ParentSpacer";
import {SaveIcon} from "../icons/SaveIcon";
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
export const SettingsRowTextEditComponent: FunctionComponent<AppState> = (props) => {

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
            if(textInput.current){
                textInput.current.focus()
            }
        }
    }, [props?.route?.params, editText])

    async function handleSave() {
        //console.log("ROW: save")
        let success = await props.onChange(textValue);
        //console.log("ROW: save success: " + success)
        if(success) {
            setEditText(false);
        }
        setLoading(false);
    }

    // corresponding componentDidMount
    useEffect(() => {
        if(loading){
            handleSave();
        }
    }, [loading])

    function renderEditActions(){
        let saveEnabled = textValue.length > 0 && textValue !== initialValue && !loading;
        return(
            <View style={{width: "100%"}}>
                <Input ref={textInput}

                       _input={{ // https://github.com/GeekyAnts/NativeBase/issues/5420
                           selectionColor: textColor,
                           // @ts-ignore
                           cursorColor: textColor,
                       }}

                       placeholder={props?.placeholder} value={textValue} onChangeText={(text) => {textTextValue(text)}}/>
                <ParentSpacer space={10} style={{marginTop: 20, width: "100%", flex: 1, flexDirection: "row", flexWrap: "wrap"}}>
                    <View style={{flex: 1}}>
                        <MyButton
                            renderIcon={(backgroundColor, textColor) => {
                                return <SaveIcon color={textColor} />
                            }}
                            accessibilityLabel={props?.saveText} disabled={!saveEnabled} onPress={async () => {
                            if(!!props.onChange){
                                setLoading(true);
                            } else {
                                //TODO: error handling
                            }
                        }}
                            label={props?.saveText}
                        >
                        </MyButton>
                    </View>
                    <View style={{flex: 1}}>
                        <MyButton iconName={"cancel"} accessibilityLabel={props?.cancelText} disabled={loading} onPress={() => {
                            setEditText(false);
                            textTextValue(initialValue);
                        }}
                            label={props?.cancelText}
                        >
                        </MyButton>
                    </View>
                </ParentSpacer>
            </View>
        )
    }

    function renderContent(){
        let textPlaceholder = <View style={{flexDirection: "row", alignItems: "center"}}><Text>{initialValue}</Text></View>;
        if(editText) {
            textPlaceholder = null;
        }

        return(
            <View style={{width: "100%", alignItems: "flex-end"}}>
                {textPlaceholder}
            </View>
        )
    }

  return (
      <SettingsRow accessibilityRole={AccessibilityRoles.adjustable} accessibilityLabel={translationEdit+": "+description} expanded={editText} onPress={editText ? undefined : () => {if(!editText) {setEditText(!editText)}}} leftContent={description} rightContent={renderContent()} leftIcon={props?.icon} >
          {renderEditActions()}
      </SettingsRow>
  )
}
