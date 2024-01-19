import React, {FunctionComponent, useState} from "react";
import {PixelRatio, StyleProp, ViewProps, ViewStyle} from "react-native";
import { View } from "./Themed";

// Define a custom style type that extends ViewStyle with string values for borderRadius
type CustomBorderStyle = {
    borderRadius?: string | number;
    borderTopRightRadius?: string | number;
    borderTopLeftRadius?: string | number;
    borderBottomRightRadius?: string | number;
    borderBottomLeftRadius?: string | number;
    opacity?: string | number;
};

// Use an intersection type to combine the custom border style with the existing ViewStyle
type ExtendedViewStyle = StyleProp<ViewStyle> & CustomBorderStyle;

// Update the type of the 'style' prop in the ExtendedViewProps interface
interface ExtendedViewProps extends ViewProps {
    style?: ExtendedViewStyle | ExtendedViewStyle[] | any; // TODO: This type definition with "any" is not correct, but it works for now. Fix it later
}

export const ViewWithPercentageSupport: FunctionComponent<ExtendedViewProps> = ({ style, children, ...props }) => {

    interface DimensionState {
        x: number | undefined;
        y: number | undefined;
        width: number | undefined;
        height: number | undefined;
        reloadNumber: number;
    }

    const [dimension, setDimension] = useState<DimensionState>({
        x: undefined,
        y: undefined,
        width: undefined, height:
        undefined,
        reloadNumber: 0
    });

    let mergedStyle: ExtendedViewStyle = {};
    if(Array.isArray(style)){
        for(let innerStyle of style){
            mergedStyle = {...mergedStyle, ...style};
        }
    } else {
        mergedStyle = style || {};
    }

    let copiedStyle: ExtendedViewStyle = JSON.parse(JSON.stringify(mergedStyle || {}));

    function fixPercentage(copiedValue: string){
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

    function fixBorderradiusStyleForFields(styles: ExtendedViewStyle, ...fieldnames: string[]){
        let newStyles = styles;

        fieldnames.forEach(fieldname => {
            // Handle the properties of CustomBorderStyle
            if (fieldname in newStyles) {
                const value = newStyles[fieldname as keyof CustomBorderStyle];
                if (typeof value === 'string') {
                    newStyles[fieldname as keyof CustomBorderStyle] = fixPercentage(value);
                }
            }
        });

        return newStyles;
    }

    copiedStyle = fixBorderradiusStyleForFields(copiedStyle, "borderRadius", "borderRadius", "borderTopRightRadius", "borderTopLeftRadius", "borderBottomRightRadius", "borderBottomLeftRadius", "borderWidth")

    function fixAbsoluteValues(copiedValue: string){
        if(!!copiedValue && !isNaN(Number(copiedValue)) && !copiedValue.endsWith("%")){
            let absoluteValue = parseInt(copiedValue);
            return PixelRatio.getPixelSizeForLayoutSize(absoluteValue)
        }
        return copiedValue;
    }

    function fixStyleForFields(styles: ExtendedViewStyle, ...fieldnames: string[]) {
        // Create a new object to hold the modified styles
        let newStyles: ExtendedViewStyle = {};

        newStyles = styles;

        fieldnames.forEach(fieldname => {
            // Handle the properties of CustomBorderStyle
            if (fieldname in newStyles) {
                const value = newStyles[fieldname as keyof CustomBorderStyle];
                if (typeof value === 'string') {
                    newStyles[fieldname as keyof CustomBorderStyle] = fixAbsoluteValues(value);
                }
            }
        });

        return newStyles;
    }


    function getFieldVariations(basefield: string){
        return [basefield, basefield+"Vertical", basefield+"Horizontal", basefield+"Left", basefield+"Right", basefield+"Top", basefield+"Bottom"]
    }

    function getFieldsVariations(...basefields: string[]){
        let variations: any[] = [];
        for(let basefield of basefields){
            variations = variations.concat(getFieldVariations(basefield));
        }
        return variations;
    }

    copiedStyle = fixStyleForFields(copiedStyle, ...getFieldsVariations("padding", "margin"))

    let outerStyle: ExtendedViewStyle = JSON.parse(JSON.stringify(copiedStyle || {}));
    if(!dimension?.width ||  !dimension?.height){
        outerStyle.opacity = 0; // render first time invisible, since we dont know the size yet
    }

    return(
        <View {...props} style={[outerStyle]} onLayout={(event) => {
                const {x, y, width, height} = event?.nativeEvent?.layout;
                setDimension({x: x, y: y, width: width, height: height, reloadNumber: dimension.reloadNumber+1});
        }}>
            {children}
        </View>
    )
}
