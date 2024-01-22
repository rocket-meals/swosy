// define button type which has a icon for left and right side with family and name and color
// also allow to set a callback for the button
// also allow the content to be a component

import { ViewWithPercentageSupport } from "../ViewWithPercentageSupport";
import {Icon, View, Text} from "@/components/Themed";
import {MyTouchableOpacity} from "@/components/buttons/MyTouchableOpacity";
import {ViewWithProjectColor} from "@/components/project/ViewWithProjectColor";
import {GestureResponderEvent} from "react-native";

export type ButtonType = {
    leftIconFamily?: any,
    leftIconName?: string | null | undefined,
    leftIconColor?: string,
    rightIconFamily?: any,
    rightIconName?: string | null | undefined,
    rightIconColor?: string,
    onPress?: () => void | ((event: GestureResponderEvent) => void)
    accessibilityLabel: string,
    text?: string,
    children?: React.ReactNode,
    disabled?: boolean,
}

// define the button component
export const MyButton = ({disabled, leftIconFamily, leftIconName, leftIconColor, rightIconFamily, rightIconName, rightIconColor, onPress, accessibilityLabel, children, text}: ButtonType) => {

    let content = null;
    if(!!children){
        content = children;
    }
    if(!!text){
        content = (
            <Text>{text}</Text>
        );
    }

    let leftIcon = null;
    if(!!leftIconName){
        leftIcon = (
            <ViewWithProjectColor style={{height: 50, width: 50, alignItems: "center", justifyContent: "center", borderRadius: 6}}>
                <Icon
                    name={leftIconName}
                    family={leftIconFamily}
                    color={leftIconColor}
                    style={{}}
                />
            </ViewWithProjectColor>
        );
    }

    let rightIcon = null;
    if(!!rightIconName){
        rightIcon = (
            <Icon
                name={rightIconName}
                family={rightIconFamily}
                color={rightIconColor}
                style={{}}
            />
        );
    }

    let buttonContent = (
        <View style={{flexDirection: "row", borderRadius: 6, flex: 1}}>
            {leftIcon}
            <View style={{justifyContent: "center", flex: 1, paddingLeft: 20}}>
                <Text>{text}</Text>
                {content}
            </View>
            {rightIcon}
        </View>
    );

    let buttonContentWrapper = (
        <ViewWithPercentageSupport>
            {buttonContent}
        </ViewWithPercentageSupport>
    )

    let touchableContent = null;

    if(!!onPress){
        touchableContent = (
            <MyTouchableOpacity disabled={disabled} onPress={onPress} accessibilityLabel={accessibilityLabel}>
                {buttonContentWrapper}
            </MyTouchableOpacity>
        );
    } else {
        touchableContent = (buttonContentWrapper);
    }

    return (
        touchableContent
    );
}