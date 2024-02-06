import React, {Dispatch, FunctionComponent, SetStateAction, useEffect, useRef, useState} from "react";
import {SettingsRowProps} from "./SettingsRow";
import {Text, TextInput, View} from "@/components/Themed";
import {SettingsRowActionsheet} from "@/components/settings/SettingsRowActionsheet";
import {MyGlobalActionSheetItem} from "@/components/actionsheet/MyGlobalActionSheet";
import {ActionsheetItem, ActionsheetItemText} from "@gluestack-ui/themed";


export const MyContent = (props: any) => {
    const {setInputValue} = props;
    const [inputValueLocal, setInputValueLocal] = useState(props?.initialValue)

    const inputRef = useRef<any>(null);

    useEffect(() => {
        if(inputRef.current){
            inputRef.current.focus();
        }
    }, []);

    return(
        <View style={{
            width: "100%", backgroundColor: "red",
        }}>
            <View style={{
                width: "100%", backgroundColor: "red",
            }}>
                <TextInput
                    ref={props?.inputRef}
                    value={inputValueLocal}
                    onChangeText={(newText: string) => {
                        console.log("OnChangeText")
                        console.log(newText);
                        if(setInputValue){
                            setInputValue(newText);
                            setInputValueLocal(newText);
                        }
                    }}
                    placeholder={props?.placeholder}
                    style={{
                        backgroundColor: '#fff', // Example styling
                        color: props?.textColor,
                        padding: 10,
                        marginVertical: 10,
                    }}
                    accessibilityLabel={props?.accessibilityLabel}
                />
            </View>
            <View style={{
                width: "100%", backgroundColor: "red", flexDirection: "row", justifyContent: "space-between"
            }}>
                <View style={{flex: 1, alignItems: "flex-start"}}>
                    <ActionsheetItem
                        sx={{
                            bg: props?.backgroundColor,
                            ":hover": {
                                bg: props?.backgroundColorOnHover,
                            },
                        }}
                        onPress={async () => {
                            props?.hide()
                        }}>
                        <ActionsheetItemText>{"li"}</ActionsheetItemText>
                        <View style={{
                            flex: 1
                        }}>
                            <ActionsheetItemText selectable={true} sx={{
                                color: props?.textColor,
                                ":hover": {
                                    color: "red",
                                },
                            }}>{"NO"}</ActionsheetItemText>
                        </View>
                    </ActionsheetItem>
                </View>
                <View style={{flex: 1, alignItems: "flex-end"}}>
                    <ActionsheetItem
                        sx={{
                            bg: props?.backgroundColor,
                            ":hover": {
                                bg: props?.backgroundColorOnHover,
                            },
                        }}
                        onPress={async () => {
                            props.onSave(inputValueLocal, props.hide);
                        }}>
                        <ActionsheetItemText>{"li"}</ActionsheetItemText>
                        <View style={{
                            flex: 1
                        }}>
                            <ActionsheetItemText selectable={true} sx={{
                                color: props?.textColor,
                                ":hover": {
                                    color: "red",
                                },
                            }}>{"Okay"}</ActionsheetItemText>
                        </View>
                    </ActionsheetItem>
                </View>
            </View>
        </View>
    )
}

interface AppState {
    accessibilityLabel: string,
    placeholder?: string,
    label: string,
    onSave: ((nextValue: string) => Promise<boolean | void>) | Dispatch<SetStateAction<string>>,
    onTrackColor?: string,
    debug?: boolean,
    disabled?: boolean
    description?: string,
}

export const SettingsRowTextEdit: FunctionComponent<AppState & SettingsRowProps> = ({accessibilityLabel, label,...props}) => {

    const title = label;

    const initialValue = props.labelRight
    const placeholder = props.placeholder;
    const [inputValue, setInputValue] = useState(initialValue)

    let items: MyGlobalActionSheetItem[] = [];


    async function onSaveChange(finalValue: string, hide: () => void){
        console.log("Save Final Value: ", finalValue);
        let result = true;
        if(props.onSave){
            let resultFromOnSave = await props.onSave(finalValue);
            if(resultFromOnSave===false){
                result = false;
            }
        }
        if(result===true){
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

    function renderDebug(){
        return(
            <>
                <Text>{"inputValue: "+inputValue}</Text>
            </>
        )
    }

    let labelRight = inputValue

    return(
        <>
            <SettingsRowActionsheet label={label} labelRight={labelRight} config={config} accessibilityLabel={accessibilityLabel} leftContent={label} {...props}  />
            {renderDebug()}
        </>
    )
}
