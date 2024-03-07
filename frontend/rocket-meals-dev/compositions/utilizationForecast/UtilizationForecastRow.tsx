import React, {useRef, useState} from "react";
import {DimensionValue, ScrollView, TouchableOpacity} from "react-native";
import {UtilizationForecastBar} from "./UtilizationForecastBar";
import {View, Text, Icon} from "@/components/Themed";
import {MyTouchableOpacity} from "@/components/buttons/MyTouchableOpacity";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";

const paddingLeft = 5;

const maxCharacters = 1024;
const minCharacters = 16;


export type UtilizationDictData = {
    [key: string]: UtilizationData
}
export type UtilizationData = {
    start: string,
    end: string,
    traffic: number | undefined
}

export type UtilizationForecastRowProps = {
    translation_openedFrom: string,
    translation_closedAfter: string,
    // utilization is a dict with key to UtilizationData
    data: UtilizationDictData
}
export const UtilizationForecastRow = (props: UtilizationForecastRowProps) => {

    const translation_utilization = useTranslation(TranslationKeys.utilization);

    let rushMinutes_openedFrom= props.translation_openedFrom
    let rushMinutes_closedAfter = props.translation_closedAfter

    const myScrollViewRef = useRef(null);

    let utilization = props?.data

    function getColorForTraffic(traffic: number | undefined) {
        let maxValue = 100;
        let lowest = (0)*maxValue;
        let medium = (3.0/6.0)*maxValue;
        let max = (5.0/6.0)*maxValue;

        let colors = {
            [lowest+""]: "#93c34b",
            [medium+""]: "#FFD500",
            [max+""]: "#F5A13C"
        };

        // colorsWithCorrectKeys is a dict with keys as string
        let colorsWithCorrectKeys: {[key: string]: string} = {};
        for(let key in colors){
            let parsedKey = parseInt(key+"");
            colorsWithCorrectKeys[parsedKey] = colors[key];
        }

        let colorBorders = Object.keys(colorsWithCorrectKeys).sort((a, b) => {
            return parseInt(a) - parseInt(b);
        });
        let lastColor = colors[colorBorders[0]];
        for (let i = 0; i < colorBorders.length; i++) {
            let border: string = colorBorders[i];
            if(traffic!==undefined){
                if (traffic >= parseInt(border)) {
                    lastColor = colorsWithCorrectKeys[border];
                }
            }
        }
        return lastColor;
    }

    function getActiveIndex(now: Date, utilization: UtilizationDictData){
        let activeIndex = -1;

        let nowHour = now.getHours();
        let nowMinute = now.getMinutes();

        let populartimes = utilization;

        let keys = Object.keys(populartimes);

        let compareTime: Date | null = null;
        let diffInMinutes: null | number = null;

        for (let i = 0; i < keys.length; i++) { //search in all for the maximum value
            let populartime = populartimes[keys[i]];

            const time = populartime.start || "";
            const timeParts = time.split(":");
            let HH = timeParts[0];
            let mm = timeParts[1];

            let nextCompareTime = new Date(now);
            nextCompareTime.setHours(parseInt(HH), parseInt(mm), 0, 0);
            if(!!compareTime){
                diffInMinutes = (nextCompareTime.getTime() - compareTime.getTime()) / 1000 / 60;
            }
            compareTime = nextCompareTime;
            if(now>=compareTime){
                activeIndex = i;
            }
        }

        if(diffInMinutes !== null && !!compareTime){
            let nextCompareTime = new Date(compareTime);
            nextCompareTime.setMinutes(nextCompareTime.getMinutes() + diffInMinutes);
            if(now>=nextCompareTime){
                activeIndex = keys.length;
            }
        }

        return activeIndex;
    }

    function scrollToElement(indexOf: number) {
        let amountInfront = 3;

        let totalItemWidth = getItemWidth()+paddingLeft;
        let offset = 0.5*totalItemWidth;
        let x = 0;

        let keys = getTimeKeys();

        if(indexOf===-1){
            indexOf = -1;
        } else {
            if(indexOf>=keys.length){
                indexOf = keys.length;
            } else {
                if(indexOf > (amountInfront-1)){
                    indexOf-=(amountInfront-1);
                } else {
                    indexOf = 0;
                }
            }
            let preItems = getClosedBarWidth()+paddingLeft;
            let itemXPosition = preItems+(indexOf*totalItemWidth);
            x = x+itemXPosition-offset; // we want to show half of the previous item
        }

        if(!isNaN(x) && !!myScrollViewRef && !!myScrollViewRef?.current){
            const scrollView = myScrollViewRef.current as ScrollView;
            scrollView.scrollTo({ x: x, y: 0, animated: true });
        }
    }

    function getNow(){
        let now = new Date();
        //now = new Date("2023-12-01T11:00:00.000Z"); //TODO remove
        return now;
    }

    function getItemWidth(){
        return 40
    }

    function getClosedBarWidth(){
        return 6*getItemWidth();
    }

    function renderClosedBar(first: boolean, isActive: boolean, lastTime: string | null){
        let text = "";
        if(first){
            text = rushMinutes_openedFrom
        } else {
            text = rushMinutes_closedAfter
        }

        let firstRenderedText = (
            text+": "+lastTime
        )

        let textBelowPlaceholder = null;
        textBelowPlaceholder = (
            " "
        );

        //let borderColor = active ? this.fontStyles.normal.color : "transparent"; // TODO:

        return renderBar(getItemWidth(), getClosedBarWidth(), "transparent", textBelowPlaceholder, firstRenderedText, isActive);
    }

    function getTimeKeys(){
        let keys = Object.keys(utilization);
        return keys;
    }

    /**
     * Render Rush Minutes
     * @returns {Array}
     */
    function renderPopularTimeCols() {
        if (!utilization) {
            return null
        }

        let now = getNow();

        let activeIndex = getActiveIndex(now, utilization);

        let keys = getTimeKeys();

        let width = getItemWidth();

        let cols = [];

        let lastTime = null;
        for (let i = 0; i < keys.length; i++) { //for all rush minutes
            let populartime = utilization[keys[i]];
            let value = populartime.traffic;

            let height = getItemWidth();
            if(value !== undefined){
                height = (height * 5) * (value / 100);
            }

            const time = populartime.start || "";
            const timeParts = time.split(":");
            let HH = timeParts[0];
            let mm = timeParts[1];

            const timeEnd = populartime.end || "";
            const timeEndParts = timeEnd.split(":");
            let HH_end = timeEndParts[0];
            let mm_end = timeEndParts[1];
            lastTime = "" + HH_end + ":" + mm_end;
            let timeAsString = "" + HH + ":" + mm;

            if(i === 0){
                let openingTime = "" + HH + ":" + mm
                const isActive = activeIndex === -1;
                cols.push(renderClosedBar(true, isActive, openingTime));
            }

            const isFullHour = parseInt(mm) === 0;

            let text = "";
            let renderedText = null;
            let renderedTextInside = "";
            text = isFullHour ? HH : "  ";
            renderedText = text;

            //let bgColor = popularTimeHour === nowHour ? "#FFD500" : "#ffffff";
            let bgColor = getColorForTraffic(value);

            const tooltip = translation_utilization+": "+ timeAsString+" - "+ value + "%";
            const accessibilityLabel = tooltip

            const isActive = i === activeIndex;
            cols.push(
                renderBar(height, width, bgColor, renderedText, renderedTextInside, isActive, tooltip, accessibilityLabel)
            );
        }

        let placeHolderRenderedText = (" ");
        //add empty item to fill the rest of the space

        const isActive = activeIndex === keys.length;
        if(keys.length > 0){
            cols.push(renderClosedBar(false, isActive, lastTime));
        }
        //cols.push(renderBar(getItemWidth(), getItemWidth(), "transparent", placeHolderRenderedText, null, false));

        let scrollViewContent = (
            <View
                accessibilityLabel={"UtilizationForecastRow"}
                style={{alignItems: "flex-end", flexGrow: 1, flexDirection: "row"}}>
                {cols}
            </View>
        )


        return (
            <View style={{flexGrow: 1, flexDirection: "row"}}>
                <ScrollView
                    ref={myScrollViewRef} onLayout={(event) => {
                        if(!!myScrollViewRef){
                            setTimeout(() => {
                                let now = getNow();
                                let activeIndex = getActiveIndex(now, utilization);
                                scrollToElement(activeIndex);
                            }, 500);
                        }
                    }}
                    contentContainerStyle={{alignItems: "flex-end" /* No use of flex: 1 or width: "100%" not working on android*/}} horizontal={true} style={{flex: 1}}>
                    {scrollViewContent}
                </ScrollView>
            </View>
        );
    }

    function renderBar(height: DimensionValue, width: DimensionValue, bgColor: string, textBelow: string | null, textInside: string | null, isActive?: boolean, tooltip?: string, accessibilityLabel?: string
    ) {
        return <UtilizationForecastBar height={height} width={width} bgColor={bgColor} textInside={textInside} textBelow={textBelow} isActive={isActive} tooltip={tooltip} accessibilityLabel={accessibilityLabel} />
    }

    const paddingTop = 5;

    return (
        <View style={{width: "100%", paddingBottom: 0}}>
            <View style={{flexDirection: "row"}}>
                <View style={{flex: 1, paddingTop: paddingTop}}>
                    {renderPopularTimeCols()}
                </View>
            </View>
        </View>
    );
}
