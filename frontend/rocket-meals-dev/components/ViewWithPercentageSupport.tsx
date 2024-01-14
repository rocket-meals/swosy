import React, {FunctionComponent, useState} from "react";
import {PixelRatio, StyleProp, ViewProps, ViewStyle} from "react-native";
import { View } from "./Themed";

export const ViewWithPercentageSupport: FunctionComponent<ViewProps> = ({style, children, ...props}) => {

    const [dimension, setDimension] = useState({x: undefined, y: undefined, width: undefined, height: undefined, reloadNumber: 0});

    let mergedStyle: any = {};
    if(Array.isArray(style)){
        for(let innerStyle of style){
            mergedStyle = {...mergedStyle, ...style};
        }
    } else {
        mergedStyle = style
    }

    let copiedStyle = JSON.parse(JSON.stringify(mergedStyle || {}));

    function fixPercentage(copiedValue){
        if(!!copiedValue && typeof copiedValue==="string" && copiedValue.endsWith("%")){
            let percentage = parseInt(copiedValue);
            let width = dimension.width;
            if(!!width && !!percentage){
                let radiusAsInt = parseInt(""+(percentage*width/100))
                return radiusAsInt;
            } else {
                return 0; // null works for ios & web but not on android: "android.graphics.Path.isEmpty()"
            }
        }
        return copiedValue;
    }

    function fixBorderradiusStyleForFields(styles, ...fieldnames){
        let mergedStyle = {};
        if(!!styles){
            if(!styles?.length){
                mergedStyle = styles;
            } else if(styles?.length > 1) {
                styles.forEach(style => {
                    mergedStyle = {...mergedStyle, ...style};
                });
            }
        }

        for(let fieldname of fieldnames){
            mergedStyle[fieldname] = fixPercentage(mergedStyle[fieldname]);
        }
        return mergedStyle;
    }

    copiedStyle = fixBorderradiusStyleForFields(copiedStyle, "borderRadius", "borderRadius", "borderTopRightRadius", "borderTopLeftRadius", "borderBottomRightRadius", "borderBottomLeftRadius", "borderWidth")

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


    let outerStyle = {...copiedStyle, ...{}};
    if(!dimension?.width ||  !dimension?.height){
        outerStyle.opacity = 0; // render first time invisible, since we dont know the size yet
    }

    return(
        <View {...props} style={[outerStyle]} onLayout={(event) => {
                const {x, y, width, height} = event.nativeEvent.layout;
                setDimension({x: x, y: y, width: width, height: height, reloadNumber: dimension.reloadNumber+1});
        }}>
            {children}
        </View>
    )
}
