// @ts-nocheck
import React, {FunctionComponent} from "react";
import {Divider, View} from "native-base";
import {Icon} from "../Icon";
import {MyThemedBox} from "../../helper/MyThemedBox";
import {SettingsRowInner} from "./SettingsRowInner";
import {MyTouchableOpacity} from "../buttons/MyTouchableOpacity";
import {AccessibilityState} from "react-native";

export interface SettingsRowProps {
    leftContent: string | any,
    rightContent?: string | any,
    leftIcon?: any | string,
    rightIcon?: any,
    onPress?: any,
    color?: any
    hideLeftContent?: boolean,
    expandable?: boolean,
    expanded?: boolean,
    customDivider?: any,
    accessibilityLabel?: string,
    accessibilityRole?: string,
    accessibilityState?: any,
    flex?: number,
    disabled?: boolean
}
export const SettingsRow: FunctionComponent<SettingsRowProps> = (props) => {

    const expanded = props.expanded;

    let onPress = props?.onPress;

    const [expandedState, setExpandedState] = React.useState(expanded);

    let expandable = props?.children !== undefined;
    if(props?.expandable !== undefined){
        expandable = props.expandable
    }

    let defaultAccessibilityState = undefined;

    if(expandable){
        onPress = () => {
            setExpandedState(!expandedState);
            if(props?.onPress){
                props.onPress()
            }
        }
        defaultAccessibilityState = {expanded: expandedState}
    }

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
            if(expandedState){
                rightIcon = <Icon name={"chevron-down"}  />;
            }
        }


        const flex = props.flex!==undefined ? props.flex : 1;

        return(
            <>
                <SettingsRowInner flex={flex} leftContent={props?.leftContent} leftIcon={renderLeftIcon()} rightContent={props?.rightContent} rightIcon={rightIcon} />
            </>
        )
    }

    function renderOuter(){
        let children = expandedState ? props.children : null

      const divider = props.customDivider!==undefined ? props.customDivider : <Divider />

        if(!!onPress){
            return(
              // @ts-ignore
                <>
                  <MyTouchableOpacity accessibilityState={defaultAccessibilityState || props?.accessibilityState} disabled={props?.disabled} accessibilityLabel={accessibilityLabel} key={props?.key+props.leftIcon} onPress={onPress} >
                    {renderInner(true)}
                  </MyTouchableOpacity>
                  {children}
                  {divider}
                </>
            )
        }
        return(
          // @ts-ignore
            <View key={props?.key+props.leftIcon} >
                {renderInner(false)}
                {children}
            </View>
        )
    }

    return(
        <MyThemedBox _shadeLevel={1}  >
            {renderOuter()}
        </MyThemedBox>
    )
}
