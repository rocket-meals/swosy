// @ts-nocheck
import React, {FunctionComponent} from "react";
import {Text, View} from "native-base";
import {Icon} from "../Icon";
import {ViewPixelRatio} from "../ViewPixelRatio";
import {ViewPercentageBorderradius} from "../ViewPercentageBorderradius";

export interface SettingsRowProps {
    leftContent: any | string | number,
    rightContent?: any | string,
    contentShouldGrow?: boolean,
    rightIcon?: any,
    leftIcon?: any,
    color?: any
    flex?: number,
    debug?: boolean
}
export const SettingsRowInner: FunctionComponent<SettingsRowProps> = (props) => {

    const debug = props?.debug;

    let outerBackgroundColor = !!debug ? "#FF0000" : "transparent";
    let leftBackgroundColor = !!debug ? "#FF6600" : "transparent";
    let rightBackgroundColor = !!debug ? "#FFAA00" : "transparent";


    let leftContent = props?.leftContent;
    if(typeof leftContent === "string" || typeof leftContent === "number"){
        leftContent = <Text>{props.leftContent+""}</Text>
    }

    let rightContent = props?.rightContent;
    if(typeof rightContent === "string" || typeof leftContent === "number"){
        rightContent = <Text>{props.rightContent}</Text>
    }

    function renderLeftIcon(){
        if(props?.leftIcon){
            return(
                <ViewPixelRatio style={{paddingRight: 10}}>
                    <ViewPercentageBorderradius style={{backgroundColor: props.color, paddingHorizontal: 5, borderRadius: "20%", justifyContent: "center"}}>
                        {props.leftIcon}
                    </ViewPercentageBorderradius>
                </ViewPixelRatio>
            )
        }
        return null;
    }

    function renderRightIcon(){
        let rightIcon = props?.rightIcon
        if(rightIcon===undefined){
            rightIcon = <View style={{opacity: 0}}><Text selectable={false}><Icon name={"chevron-right"}  /></Text></View>;
        }
        if(rightIcon===null){
            return null;
        }

            return(
                <ViewPixelRatio style={{marginLeft: 0}}>
                    <ViewPercentageBorderradius style={{backgroundColor: props.color, paddingHorizontal: 5, borderRadius: "20%", justifyContent: "center"}}>
                        {rightIcon}
                    </ViewPercentageBorderradius>
                </ViewPixelRatio>
            )
    }

    let innerFlexStyle = {flex: props?.flex}

    let renderedLeftContent = null;
    if(leftContent){
        renderedLeftContent = (
            <View style={{justifyContent: "flex-start", flexWrap: "wrap", alignItems: "flex-start", backgroundColor: leftBackgroundColor, ...innerFlexStyle}}>
                {leftContent}
            </View>
        )
    }

    let renderedRightContent = null;
    if(rightContent){
        renderedRightContent = (
            <View style={{flexWrap: "wrap-reverse" ,marginLeft: 5,justifyContent: "flex-start", alignItems: "flex-start", backgroundColor: rightBackgroundColor, ...innerFlexStyle}}>
                {rightContent}
            </View>
        )
    }

    return(
        <View style={{flexDirection: "row", justifyContent: "flex-start", paddingHorizontal: 10, paddingVertical: 10, flexGrow: 1, backgroundColor: outerBackgroundColor}}>
            {renderLeftIcon()}
            {renderedLeftContent}
            {renderedRightContent}
            <View style={{alignSelf: "flex-start", alignItems: "flex-end", flexDirection: "row"}}>
                {renderRightIcon()}
            </View>
        </View>
    )
}
