import React, {FunctionComponent} from "react";
import {TouchableOpacity} from "react-native";
import {CommonSystemActionHelper} from "../SystemActionHelper";
import {LocationType} from "./LocationType";
import {Text, Tooltip} from "native-base";

export type NotificationHelperComponentProps = {
    location: LocationType,
    style?: any;
    accessibilityHint?: string; // "open"
    accessibilityLabel?: string; // distance as text
}
export const LocationOpenerComponent: FunctionComponent<NotificationHelperComponentProps> = (props) => {

    const location = props?.location;
    const accessibilityHint = props?.accessibilityHint || "open";
    const accessibilityLabel = props?.accessibilityLabel || accessibilityHint;

    function onPress(){
        CommonSystemActionHelper.openMaps(location);
    }

    return(
        <Tooltip label={accessibilityLabel}>
            <TouchableOpacity style={props?.style} onPress={onPress} accessibilityLabel={accessibilityLabel}>
                {props.children}
            </TouchableOpacity>
        </Tooltip>
    )

}
