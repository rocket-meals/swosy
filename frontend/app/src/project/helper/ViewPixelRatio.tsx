// @ts-nocheck
import React, {FunctionComponent, useState} from "react";
import {PixelRatio, ViewProps} from "react-native";
import {View} from "native-base";

export const ViewPixelRatio: FunctionComponent<ViewProps> = (props) => {

    let mergedStyle = {};
    if(Array.isArray(props.style)){
        for(let style of props.style){
            mergedStyle = {...mergedStyle, ...style};
        }
    } else {
        mergedStyle = props.style
    }

    let copiedStyle = JSON.parse(JSON.stringify(mergedStyle || {}));

    function fixAbsoluteValues(copiedValue){
        if(!!copiedValue && !isNaN(copiedValue) && !copiedValue.endsWith("%")){
            let absoluteValue = parseInt(copiedValue);
            return PixelRatio.getPixelSizeForLayoutSize(absoluteValue)
        }
        return copiedValue;
    }

    function fixStyleForFields(style, ...fieldnames){
        for(let fieldname of fieldnames){
            style[fieldname] = fixAbsoluteValues(style[fieldname]);
        }
        return style;
    }

    function getFieldVariations(basefield){
        return [basefield, basefield+"Vertical", basefield+"Horizontal", basefield+"Left", basefield+"Right", basefield+"Top", basefield+"Bottom"]
    }

    function getFieldsVariations(...basefields){
        let variations = [];
        for(let basefield of basefields){
            variations = variations.concat(getFieldVariations(basefield));
        }
        return variations;
    }

    copiedStyle = fixStyleForFields(copiedStyle, getFieldsVariations("padding", "margin"))



    return(
        <View style={copiedStyle}>
            {props.children}
        </View>
    )
}
