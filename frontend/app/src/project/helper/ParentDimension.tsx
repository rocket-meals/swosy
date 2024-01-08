// @ts-nocheck
import React, {FunctionComponent, useState} from "react";
import { View } from "react-native";

interface AppState {
    setDimension?: (x, y, width, height) => any;
    style?: any;
}
export const ParentDimension: FunctionComponent<AppState> = (props) => {

    return(
        <View style={props.style} onLayout={(event) => {
                const {x, y, width, height} = event.nativeEvent.layout;
                if(!!props.setDimension){
                    props.setDimension(x, y, width, height);
                }
        }}>
            {props.children}
        </View>
    )
}
