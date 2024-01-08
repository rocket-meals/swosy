// @ts-nocheck
import React, {FunctionComponent} from "react";
import {Divider, View} from "native-base";
import {Icon} from "../../../kitcheningredients";
import {MyThemedBox} from "../../../kitcheningredients"
import {SettingsRowInner} from "./SettingsRowInner";
import {MyTouchableOpacity} from "../buttons/MyTouchableOpacity";

export interface SettingsRowProps {
    leftContent: string | any,
    rightContent?: string | any,
    leftIcon?: any | string,
    rightIcon?: any,
    onPress: any,
    color?: any
    hideLeftContent?: boolean,
    expandable?: boolean,
    expanded?: boolean,
    customDivider?: any,
    accessibilityLabel?: string,
    accessibilityRole?: string,
    accessibilityState?: any,
    flex?: number,
    shadeLevel?: number
}
export const SettingsRow: FunctionComponent<SettingsRowProps> = (props) => {

    const expanded = props.expanded;

    let accessibilityLabel = props?.accessibilityLabel
    if (accessibilityLabel === undefined) {
        accessibilityLabel = "";
        let leftContent = props?.leftContent;
        if(typeof leftContent === "string"){
            accessibilityLabel += leftContent
        }
        if(!!accessibilityLabel && accessibilityLabel.length > 0){
            accessibilityLabel += " "
        }
        let rightContent = props?.rightContent;
        if(typeof rightContent === "string"){
            accessibilityLabel += rightContent
        }
    }

    function renderLeftIcon(){
        if(props?.leftIcon){
            if(typeof props?.leftIcon === "string"){
                return <Icon name={props.leftIcon} />
            }
            return props.leftIcon
        }
        return null;
    }

    function renderInner(showPress){
        let rightIcon = props?.rightIcon
        if(showPress && !rightIcon){
            rightIcon = <Icon name={"chevron-right"}  />;
        }

        const divider = props.customDivider!==undefined ? props.customDivider : <Divider />

        const flex = props.flex!==undefined ? props.flex : 1;

        return(
            <>
                <SettingsRowInner flex={flex} leftContent={props?.leftContent} leftIcon={renderLeftIcon()} rightContent={props?.rightContent} rightIcon={rightIcon} />
                {divider}
            </>
        )
    }

    function renderOuter(){
        let children = expanded ? props.children : null

        if(!!props.onPress){
            return(
                <MyTouchableOpacity accessibilityState={props?.accessibilityState} accessibilityRole={props?.accessibilityRole} accessibilityLabel={accessibilityLabel} key={props?.key+props.leftIcon} onPress={props.onPress} >
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

    let shadeLevel = props?.shadeLevel
    if(shadeLevel===undefined){
        shadeLevel = 1;
    }

    return(
        <MyThemedBox _shadeLevel={shadeLevel}  >
            {renderOuter()}
        </MyThemedBox>
    )
}
