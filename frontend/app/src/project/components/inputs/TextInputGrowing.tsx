import React, {FunctionComponent, useCallback, useState} from "react";
import {Input, useTheme, View, Text} from "native-base";
import {PlatformHelper, useThemeTextColor} from "../../../kitcheningredients";
import {StringHelper} from "../../helper/StringHelper";

export interface AppState {
    disabled?: boolean,
    initialValue?: string,
    numberOfLinesWeb?: number,
    numberOfLinesNative?: number,
    placeholder?: string,
    leftContent?: any,
    rightContent?: any
    inputRef?: any
    onChangeText?: (string) => Promise<boolean>
    InputLeftElement?: any
    InputRightElement?: any
    onFocus?: any
    onBlur?: any
}

export const TextInputGrowing: FunctionComponent<AppState> = (props) => {

    const [lineHeight, setLineHeight] = useState(0);

    const theme = useTheme();
    let fontSize = theme["fontSizes"]["lg"]

    const textColor = useThemeTextColor();


    let defaultInitialValue = "";
    const [textValue, setTextValue] = useState(props?.initialValue || defaultInitialValue);

    const [numberOfLines, setNumberOfLines] = useState(1);

    const numberOfLinesWeb = props?.numberOfLinesWeb;
    const numberOfLinesNative = props?.numberOfLinesNative;
    const passedNumberOfLines = PlatformHelper.isWeb() ? numberOfLinesWeb : numberOfLinesNative

    const useNumberOfLines = passedNumberOfLines || numberOfLines

    const handleFocus = useCallback(() => {
        setNumberOfLines(5);
    }, [])

    const handleBlur = useCallback(() => {
        setNumberOfLines(1);
    }, [])

    const getLineHeight = useCallback((event) => {
        setLineHeight(event.nativeEvent.layout.height);
    });

    const maxHeight = Math.round(useNumberOfLines * lineHeight + 0.5*lineHeight);

    if(!lineHeight){
        return(
            <View style={{backgroundColor: "orange", width: "100%"}}>
                <Text onLayout={getLineHeight}>{"HI: "+lineHeight}</Text>
            </View>
        )
    }

    return (
        <View style={{width: "100%"}}>
            <View style={{width: "100%", flexDirection: "row"}}>
                <View style={{flex: 1, maxHeight: maxHeight}}>
                    <Input
                        isDisabled={props?.disabled}
                        style={{
                            fontSize: fontSize,
                            color: textColor,
                            borderWidth: 0,
                            maxHeight: maxHeight
                        }}

                        _input={{ // https://github.com/GeekyAnts/NativeBase/issues/5420
                            selectionColor: textColor,
                            // @ts-ignore
                            cursorColor: textColor,
                            borderWidth: 0,
                            maxHeight: maxHeight
                        }}

                        borderWidth={0}

                        value={textValue}
                        placeholder={props?.placeholder || "Message..."}
                        placeholderTextColor={textColor}
                        numberOfLines={useNumberOfLines}
                        onFocus={props?.onFocus || handleFocus}
                        InputRightElement={props?.InputRightElement}
                        InputLeftElement={props?.InputLeftElement}
                        onBlur={props?.onBlur || handleBlur}
                        multiline={true}
                        onChangeText={async (text) => {
                            let success = true;
                            if(props?.onChangeText){
                                success = await props?.onChangeText(text);
                            }
                            if(success){
                                setTextValue(text || "")
                            }
                        }}
                    />
                </View>
            </View>
        </View>

    )
}
