import React, {Dispatch, FunctionComponent, SetStateAction, useEffect, useRef, useState} from "react";
import {SettingsRowProps} from "./SettingsRow";
import {TextInput, View} from "@/components/Themed";
import {SettingsRowActionsheet} from "@/components/settings/SettingsRowActionsheet";
import {MyGlobalActionSheetItem} from "@/components/actionsheet/MyGlobalActionSheet";
import {MyButton} from "@/components/buttons/MyButton";
import {ReturnKeyType} from "@/helper/input/ReturnKeyType";

interface MyContentProps {
    initialValue: string | undefined | null,
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
        handleFocusTextInput();
    }, [inputRef?.current])

    function handleOnSave(){
        props.onSave(inputValueLocal, props.hide);
    }

    let usedValue = inputValueLocal || "";

    return(
        <View style={{
            width: "100%",
            marginTop: 10,
        }}>
            <View style={{
                width: "100%",
            }}>
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
            </View>
            <View style={{
                width: "100%", flexDirection: "row", marginTop: 10, justifyContent: "flex-end", marginBottom: 10
            }}>
                <MyButton useOnlyNecessarySpace={true} isActive={false} accessibilityLabel={"Cancel"} text={"Cancel"} onPress={async () => {
                    props?.hide()
                }} leftIcon={"close"} />
                <View style={{
                    // small space between the buttons
                    width: 10,
                }} />
                <MyButton useOnlyNecessarySpace={true} accessibilityLabel={"Save"} text={"Save"} onPress={handleOnSave} isActive={true} leftIcon={"content-save"} />
            </View>
        </View>
    )
}

interface AppState {
    accessibilityLabel: string,
    placeholder?: string,
    label: string,
    // onSave is a function that returns a boolean or a promise that resolves to a boolean or void or Dispatch<SetStateAction<string>>
    onSave: (value: string | undefined | null) => (boolean | void) | Promise<boolean | void> | Dispatch<SetStateAction<string>>,
    onTrackColor?: string,
    debug?: boolean,
    disabled?: boolean
    description?: string,
}

export const SettingsRowTextEdit: FunctionComponent<AppState & SettingsRowProps> = ({accessibilityLabel, label, rightIcon,...props}) => {

    const title = label;

    const initialValue = props.labelRight
    const placeholder = props.placeholder;
    const [inputValue, setInputValue] = useState(initialValue)

    let items: MyGlobalActionSheetItem[] = [];


    async function onSaveChange(finalValue: string | undefined | null, hide: () => void){
        //console.log("Save Final Value: ", finalValue);
        let result: boolean = true;
        if(props.onSave){
            //console.log("Has onSave")
            let resultFromOnSave = await props.onSave(finalValue);
            //console.log("Result from onSave: ", resultFromOnSave);
            if(resultFromOnSave===false){
                result = false;
            }
        }
        if(result){
            setInputValue(finalValue)
            hide()
        } else {
            setInputValue(initialValue)
        }
    }

    items.push({
        key: "test",
        label: label,
        icon: "test",
        active: false,
        accessibilityLabel: "test",
        render: (backgroundColor, backgroundColorOnHover, textColor, lighterOrDarkerTextColor, hide) => {
            // Use the custom context provider to provide the input value and setter
            return<MyContent
                initialValue={initialValue}
                setInputValue={setInputValue}
                onSave={onSaveChange}
                placeholder={placeholder}
                backgroundColor={backgroundColor}
                backgroundColorOnHover={backgroundColorOnHover}
                textColor={textColor}
                lighterOrDarkerTextColor={lighterOrDarkerTextColor}
                hide={hide} />
        }
    })


    const config = {
        onCancel: async () => {
            setInputValue(initialValue)
          return true;
        },
        visible: true,
        title: title,
        items: items
    }

    let labelRight = inputValue

    let usedIconRight = rightIcon;
    if(usedIconRight===undefined){
        usedIconRight = "pencil"
    }

    return(
        <SettingsRowActionsheet rightIcon={usedIconRight} label={label} labelRight={labelRight} config={config} accessibilityLabel={accessibilityLabel} leftContent={label} {...props}  />
    )
}
