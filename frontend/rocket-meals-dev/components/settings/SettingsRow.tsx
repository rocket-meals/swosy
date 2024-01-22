import React, {FunctionComponent} from "react";
import {SettingsRowInner} from "./SettingsRowInner";
import {Icon, View, Text} from "@/components/Themed";
import {ChevronRightIcon, ChevronsRightIcon, Divider} from "@gluestack-ui/themed";
import {AccessibilityRole} from "react-native";
import {MyTouchableOpacity} from "@/components/buttons/MyTouchableOpacity";

export interface SettingsRowProps {
    key?: any;
    children?: any;
    leftContent?: string | any,
    rightContent?: string | any,
    leftIcon?: any | string,
    rightIcon?: any,
    onPress?: any,
    color?: any
    hideLeftContent?: boolean,
    expandable?: boolean,
    expanded?: boolean,
    customDivider?: any,
    accessibilityLabel: string,
    accessibilityRole?: AccessibilityRole | undefined,
    accessibilityState?: any,
    flex?: number,
    shadeLevel?: number
}
export const SettingsRow: FunctionComponent<SettingsRowProps> = (props) => {

    const expanded = props.expanded;

    let accessibilityLabel = props.accessibilityLabel

    function renderLeftIcon(){
        if(props?.leftIcon){
            if(typeof props?.leftIcon === "string"){
                return <Icon name={props.leftIcon} />
            }
            return props.leftIcon
        }
        return null;
    }

    function renderRightIcon(showPress: boolean){
        let rightIcon = props?.rightIcon
        if(showPress && !rightIcon){
            rightIcon = <Icon as={ChevronRightIcon}  />;
        }
        if(rightIcon && typeof props?.rightIcon === "string"){
            return <Icon name={props.rightIcon} />
        }
        return rightIcon
    }

    function renderInner(showPress: boolean){
        let rightIcon = renderRightIcon(showPress)

        const divider = props.customDivider!==undefined ? props.customDivider : <Divider />

        const flex = props.flex!==undefined ? props.flex : 1;

        let leftContent = props?.leftContent
        if(leftContent===undefined){
            leftContent = <Text>{accessibilityLabel}</Text>
        }

        return(
            <>
                <SettingsRowInner flex={flex} leftContent={leftContent} leftIcon={renderLeftIcon()} rightContent={props?.rightContent} rightIcon={rightIcon} />
                {divider}
            </>
        )
    }

    function renderOuter(){
        let children = expanded ? props.children : null

        if(!!props.onPress){
            return(
                <MyTouchableOpacity accessibilityState={props?.accessibilityState} accessibilityRole={props?.accessibilityRole} accessibilityLabel={accessibilityLabel} key={props?.key+props.leftIcon} onPointerDown={props.onPress} >
                    {renderInner(true)}
                    {children}
                </MyTouchableOpacity>
            )
        }
        return(
            <View key={props?.key+props.leftIcon} >
                {renderInner(false)}
                {children}
            </View>
        )
    }

    return(
        <View style={{width: "100%"}} >
            {renderOuter()}
        </View>
    )
}
