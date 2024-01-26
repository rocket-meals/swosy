import React, {FunctionComponent} from "react";
import {View} from "@/components/Themed";

interface AppState {
    gradientHeight?: number
}
export const ShowMoreGradientPlaceholder: FunctionComponent<AppState> = (props) => {

    let padding = props.gradientHeight
    if(padding=== undefined){
        padding = 12
    }

    return (
        <View style={{opacity: 0}}>
            <View style={{padding: padding}} >

            </View>
        </View>
    );

}
