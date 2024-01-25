// define button type which has a icon for left and right side with family and name and color
// also allow to set a callback for the button
// also allow the content to be a component

import { ViewWithPercentageSupport } from "../ViewWithPercentageSupport";
import {Icon, View, Text} from "@/components/Themed";
import {MyTouchableOpacity} from "@/components/buttons/MyTouchableOpacity";
import {ViewWithProjectColor} from "@/components/project/ViewWithProjectColor";
import {GestureResponderEvent, ViewProps} from "react-native";
import {useProjectColor} from "@/helper/sync_state_helper/custom_sync_states/ProjectInfo";
import {useMyContrastColor} from "@/helper/color/MyContrastColor";

export type ButtonType = {
    useProjectColorAsBackgroundColor?: boolean,
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
    style?: ViewProps["style"] | ViewProps["style"][],
    innerStyle?: ViewProps["style"] | ViewProps["style"][],
}

// define the button component
export const MyButton = ({useProjectColorAsBackgroundColor, style, disabled, leftIconFamily, leftIconName, leftIconColor, rightIconFamily, rightIconName, rightIconColor, onPress, accessibilityLabel, children, text}: ButtonType) => {

    const projectColor = useProjectColor()
    const backgroundColor = useProjectColorAsBackgroundColor ? projectColor : "#FFFFFF"
    let textContrastColor = useMyContrastColor(backgroundColor);

    let content = null;
    if(!!children){
        content = children;
    }
    if(!!text){
        content = (
            <Text style={{color: textContrastColor}}>{text}</Text>
        );
    }

    const borderRadius = 6;

    let leftIcon = null;
    if(!!leftIconName){
        leftIcon = (
            <ViewWithProjectColor style={{height: 50, width: 50, alignItems: "center", justifyContent: "center", borderRadius: borderRadius}}>
                <Icon
                    name={leftIconName}
                    family={leftIconFamily}
                    color={leftIconColor || textContrastColor}
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
                color={rightIconColor || textContrastColor}
                style={{}}
            />
        );
    }


    // check if style is an array
    let mergedStyle: ViewProps["style"] = {
        width: "100%",
        borderColor: projectColor,
        borderWidth: 1,
        flexDirection: "row",
        marginVertical: 5,
        marginRight: 20,
        borderRadius: borderRadius,
        backgroundColor: useProjectColorAsBackgroundColor ? projectColor : undefined,
    };
    if(Array.isArray(style)){
        for(let singleStyle of style){
            // @ts-ignore
            mergedStyle = {...mergedStyle, ...singleStyle};
        }
    } else {
        // @ts-ignore
        mergedStyle = {...mergedStyle, ...style};
    }

    let innerContent = (
        <>
            {leftIcon}
            <View style={{justifyContent: "center", flex: 1, paddingLeft: 10}}>
                {content}
            </View>
            {rightIcon}
        </>
    )

    return(
        <MyTouchableOpacity onPress={onPress} accessibilityLabel={accessibilityLabel} style={mergedStyle}>
            {innerContent}
        </MyTouchableOpacity>
    )
}