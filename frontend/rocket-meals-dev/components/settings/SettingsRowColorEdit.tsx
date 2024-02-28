import React, {Dispatch, FunctionComponent, SetStateAction, useEffect, useRef, useState} from "react";
import {SettingsRowProps} from "./SettingsRow";
import {TextInput, View} from "@/components/Themed";
import {SettingsRowActionsheet} from "@/components/settings/SettingsRowActionsheet";
import {MyGlobalActionSheetConfig, MyGlobalActionSheetItem} from "@/components/actionsheet/MyGlobalActionSheet";
import {MyButton} from "@/components/buttons/MyButton";
import {ReturnKeyType} from "@/helper/input/ReturnKeyType";
import {IconNames} from "@/constants/IconNames";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {SimpleColorPicker} from "@/components/colorpicker/SimpleColorPicker";
import {ColorHelper} from "@/components/colorpicker/ColorHelper";

interface MyContentProps {
    initialValue: string | undefined | null,
    allowCustomColor?: boolean,
    setInputValue: Dispatch<SetStateAction<string | undefined | null>>,
    onSave: (value: string | undefined | null, hide: () => void) => void,
    placeholder?: string,
    backgroundColor?: string,
    backgroundColorOnHover?: string,
    textColor?: string,
    lighterOrDarkerTextColor?: string,
    hide: () => void,
}
const MyContent: FunctionComponent<MyContentProps> = (props) => {
    const {setInputValue} = props;
    const [inputValueLocal, setInputValueLocal] = useState(props?.initialValue)

    const allowCustomColor = props.allowCustomColor;

    const translation_cancel = useTranslation(TranslationKeys.cancel)
    const translation_save = useTranslation(TranslationKeys.save)

    const inputRef = useRef<any>(null);

    function handleFocusTextInput(){
        // Workaround for android: https://github.com/facebook/react-native/issues/19366
        if(inputRef.current){
            inputRef.current.blur();

            setTimeout(() => {
                inputRef.current.focus();
            }, 100);
        }
    }

    // After the component mounts, focus the input
    useEffect(() => {
        if(allowCustomColor){
            handleFocusTextInput();
        }
    }, [inputRef?.current])

    function handleOnSave(){
        props.onSave(inputValueLocal, props.hide);
    }

    let usedValue = inputValueLocal || "";

    let renderedTextInput = null;
    if(allowCustomColor){
        renderedTextInput = (
            <TextInput
                myRef={inputRef}
                value={usedValue}
                onChangeText={(newText: string) => {
                    let usedNewText: string | undefined | null = newText;
                    console.log("OnChangeText")
                    console.log(newText);
                    if(usedNewText==="") {
                        usedNewText = null;
                    }

                    if(setInputValue){
                        setInputValue(usedNewText);
                        setInputValueLocal(usedNewText);
                    }
                }}
                returnKeyType={ReturnKeyType.done}
                onSubmitEditing={handleOnSave}
                placeholder={props?.placeholder}
            />
        )
    }

    return(
        <View style={{
            width: "100%",
            flexShrink: 1,
            marginTop: 10,
        }}>
            <View style={{
                width: "100%",
                flexShrink: 1,
            }}>
                <SimpleColorPicker onColorChange={async (color) => {
                    setInputValueLocal(color);
                    setInputValue(color);
                    props.onSave(color, props.hide);
                }} />
            </View>
            <View style={{
                width: "100%",
            }}>
                {renderedTextInput}
            </View>
            <View style={{
                width: "100%", flexDirection: "row", marginTop: 10, justifyContent: "flex-end", marginBottom: 10
            }}>
                <MyButton useOnlyNecessarySpace={true} isActive={false} accessibilityLabel={translation_cancel} text={translation_cancel} onPress={async () => {
                    props?.hide()
                }} leftIcon={IconNames.cancel_icon} />
                <View style={{
                    // small space between the buttons
                    width: 10,
                }} />
                <MyButton useOnlyNecessarySpace={true} accessibilityLabel={translation_save} text={translation_save} onPress={handleOnSave} isActive={true} leftIcon={IconNames.save_icon} />
            </View>
        </View>
    )
}

interface SettingsRowColorEditSpeicificProps {
    accessibilityLabel: string,
    placeholder?: string,
    allowCustomColor?: boolean,
    labelLeft: string,
    // onSave is a function that returns a boolean or a promise that resolves to a boolean or void or Dispatch<SetStateAction<string>>
    onSave: (value: string | undefined | null, hide?: () => void) => (boolean | void | Promise<boolean | void>) | Dispatch<SetStateAction<string>>,
    onTrackColor?: string,
    debug?: boolean,
    value?: string,
    disabled?: boolean
    description?: string,
}

export type SettingsRowTextEditProps = SettingsRowProps & SettingsRowColorEditSpeicificProps;

export const SettingsRowColorEdit = ({accessibilityLabel,allowCustomColor, labelLeft, rightIcon,...props}: SettingsRowTextEditProps) => {

    const title = labelLeft;

    const translation_for_example = useTranslation(TranslationKeys.for_example)

    const initialValue = props?.value || props.labelRight
    const placeholder = props.placeholder || "Hex-Code ("+translation_for_example+" #FF0000)"
    const [inputValue, setInputValue] = useState(initialValue)
    let labelRight = inputValue
    if(props.labelRight){
        labelRight = props.labelRight
    }

    async function onSaveChange(finalValue: string | undefined | null, hide: () => void){
        //console.log("Save Final Value: ", finalValue);
        let result: boolean = true;
        // check if onSave is a function with one or two parameters
        let hasTwoParameters = false;
        if(props.onSave.length===2){
            hasTwoParameters = true;
        }

        let isValidColor = ColorHelper.isHexColor(finalValue);
        if(isValidColor){
            if(props.onSave){
                let resultFromOnSave = await props.onSave(finalValue, hide);
                if(resultFromOnSave===false){
                    result = false;
                }
            }
        } else {
            result = false;
        }

        setInputValue(initialValue)

        if(!hasTwoParameters && result){
            hide()
        }
    }

    const config: MyGlobalActionSheetConfig = {
        onCancel: async () => {
            setInputValue(initialValue)
          return true;
        },
        visible: true,
        title: title,
        renderCustomContent: (backgroundColor, backgroundColorOnHover, textColor, lighterOrDarkerTextColor, hide) => {
            // Use the custom context provider to provide the input value and setter
            return <MyContent
                initialValue={initialValue}
                setInputValue={setInputValue}
                allowCustomColor={allowCustomColor}
                onSave={onSaveChange}
                placeholder={placeholder}
                backgroundColor={backgroundColor}
                backgroundColorOnHover={backgroundColorOnHover}
                textColor={textColor}
                lighterOrDarkerTextColor={lighterOrDarkerTextColor}
                hide={hide} />
        }

    }

    let usedIconRight = rightIcon;
    if(usedIconRight===undefined){
        usedIconRight = IconNames.edit
    }

    return(
        <SettingsRowActionsheet rightIcon={usedIconRight} labelLeft={labelLeft} labelRight={labelRight} config={config} accessibilityLabel={accessibilityLabel} {...props}  />
    )
}
