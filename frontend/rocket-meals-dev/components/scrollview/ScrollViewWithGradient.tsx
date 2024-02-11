import React, {FunctionComponent} from "react";
import {ScrollViewProps} from 'react-native';
import {ShowMoreGradient} from "./ShowMoreGradient";
import {ShowMoreGradientPlaceholder} from "./ShowMoreGradientPlaceholder";
import {View} from "@/components/Themed";
import {MyScrollView} from "@/components/scrollview/MyScrollView";

interface AppState {
    hideGradient?: boolean
    scrollViewProps?: ScrollViewProps
    gradientBackgroundColor?: string
    gradientHeight?: number
}
export const ScrollViewWithGradient: FunctionComponent<AppState & ScrollViewProps> = (props) => {

    let horizontal: boolean | undefined | null = !!props?.scrollViewProps?.horizontal;

    let hideGradient = props.hideGradient;
    let renderedGradient = hideGradient ? null : <ShowMoreGradient gradientHeight={props?.gradientHeight} horizontal={horizontal} gradientBackgroundColor={props?.gradientBackgroundColor} />
    let renderedPlaceholder = hideGradient ? null : <ShowMoreGradientPlaceholder gradientHeight={props?.gradientHeight} />


    let flexDirection: "row" | "column" | "row-reverse" | "column-reverse" | undefined = horizontal ? "row" : "column";

    return(
        <View style={{width: "100%", height: "100%", flexDirection: flexDirection}} onLayout={props.onLayout}>
            <MyScrollView
                overScrollMode={"always"}
                style={props.style}
                contentContainerStyle={{ width: '100%', alignItems: "center"}}
                showsVerticalScrollIndicator={true}
                {...props.scrollViewProps}
            >
                {props.children}
                {renderedPlaceholder}
            </MyScrollView>
            {renderedGradient}
        </View>
    )
}
