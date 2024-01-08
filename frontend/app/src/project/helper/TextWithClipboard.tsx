import React, {FunctionComponent} from "react";
import {Text, useToast, useClipboard} from "native-base";
import {TouchableOpacity} from "react-native";
import {MyClipboard} from "./MyClipboard";

interface AppState {
    text?: string,
    style?: any,
    onPress?: any,
}
export const TextWithClipboard: FunctionComponent<AppState> = (props) => {

    const toast = useToast();
    const clipboard = useClipboard();

    function renderText(){
        if(!props.children && !!props?.text){
            return <Text>{props.text}</Text>
        }
    }

    return (
        <TouchableOpacity style={props?.style || {}} onPress={async () => {
            let textToCopy = props?.text+"";
            await MyClipboard.copyText(toast, clipboard, textToCopy);
            if(!!props?.onPress){
                props.onPress(textToCopy)
            }
        }} >
            {renderText()}
            {props.children}
        </TouchableOpacity>
    )
}
