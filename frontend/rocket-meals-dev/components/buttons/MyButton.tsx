// define button type which has a icon for left and right side with family and name and color
// also allow to set a callback for the button
// also allow the content to be a component

import { ViewWithPercentageSupport } from "../ViewWithPercentageSupport";
import {Icon, View, Text} from "@/components/Themed";
import {MyTouchableOpacity} from "@/components/buttons/MyTouchableOpacity";
import {ViewWithProjectColor} from "@/components/project/ViewWithProjectColor";

export type ButtonType = {
    leftIconFamily?: any,
    leftIconName?: string,
    leftIconColor?: string,
    rightIconFamily?: any,
    rightIconName?: string,
    rightIconColor?: string,
    callback?: () => void,
    accessibilityLabel: string,
    text?: string,
    children?: React.ReactNode,
}

// define the button component
export const MyButton = ({leftIconFamily, leftIconName, leftIconColor, rightIconFamily, rightIconName, rightIconColor, callback, accessibilityLabel, children, text}: ButtonType) => {

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
                {children}
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

    if(!!callback){
        touchableContent = (
            <MyTouchableOpacity onPress={callback} accessibilityLabel={accessibilityLabel}>
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