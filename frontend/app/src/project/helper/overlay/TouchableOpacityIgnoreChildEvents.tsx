import React from "react";
import {View} from "native-base";
import {TouchableOpacity} from "react-native";

export const TouchableOpacityIgnoreChildEvents = ({onPress, style, useDefaultOpacity,children, ...props}) => {
    const opacity = useDefaultOpacity ? 0.3 : 1;

    let isStyleArray = Array.isArray(style);
    const opacityStyle = {opacity: opacity};
    let mergedStyle = {...opacityStyle, ...style };
    if(isStyleArray){
        mergedStyle = [opacityStyle ,...style];
    }

    return(
        <TouchableOpacity {...props} style={mergedStyle} onPress={() => {
            if(onPress){
                onPress();
            }
        }}>
            <View pointerEvents={"none"}>
                {children}
            </View>
        </TouchableOpacity>
    )

}
