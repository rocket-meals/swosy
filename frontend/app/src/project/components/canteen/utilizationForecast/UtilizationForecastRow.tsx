import React, {FunctionComponent, useRef, useState} from "react";
import {ScrollView, TouchableOpacity} from "react-native";
import {Text, View} from "native-base";
import {Icon, TranslationKeys} from "../../../../kitcheningredients";
import {UtilizationForecastBar} from "./UtilizationForecastBar";
import {useAppTranslation} from "../../translations/AppTranslation";

const paddingLeft = 5;

const maxCharacters = 1024;
const minCharacters = 16;

/**
 * RushMinutes can show the user how full the canteen is probably
 */
export const UtilizationForecastRow: FunctionComponent = (props) => {

    let rushMinutes_openedFrom= useAppTranslation(TranslationKeys.rushMinutes_openedFrom);
    let rushMinutes_closedAfter = useAppTranslation(TranslationKeys.rushMinutes_closedAfter);

    const myScrollViewRef = useRef(null);

    const translation_rusMinutes = "Rush-Minutes"
    const translation_time = "Uhrzeit"


    let utilization = props?.utilization;
    let date = props?.date;

    let [showDetails, setShowDetails] = useState(false)
    let [feedback, setFeedback] = useState("")

    function getColorForTraffic(traffic) {
        let maxValue = 100;
        let lowest = (0)*maxValue;
        let medium = (3.0/6.0)*maxValue;
        let max = (5.0/6.0)*maxValue;

        let colors = {
            [lowest]: "#93c34b",
            [medium]: "#FFD500",
            [max]: "#F5A13C"
        };

        let colorsWithCorrectKeys = {};
        for(let key in colors){
            let parsedKey = parseInt(key+"");
            colorsWithCorrectKeys[parsedKey] = colors[key];
        }

        // @ts-ignore
        let colorBorders = Object.keys(colorsWithCorrectKeys).sort((a, b) => a - b);
        let lastColor = colors[colorBorders[0]];
        for (let i = 0; i < colorBorders.length; i++) {
            let border = colorBorders[i];
            if (traffic >= parseInt(border)) {
                lastColor = colorsWithCorrectKeys[border];
            }
        }
        return lastColor;
    }

    function getActiveIndex(now, utilization){
        let activeIndex = -1;

        let nowHour = now.getHours();
        let nowMinute = now.getMinutes();

        let populartimes = utilization;

        let keys = Object.keys(populartimes);

        let compareTime: Date = null;
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
                // @ts-ignore
                diffInMinutes = (nextCompareTime - compareTime) / 1000 / 60;
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
                activeIndex = populartimes.length;
            }
        }

        return activeIndex;
    }

    function scrollToElement(indexOf) {
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
            myScrollViewRef.current.scrollTo({ x: x, y: 0, animated: true });
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

    function renderClosedBar(first, isActive, lastTime){
        let text = "";
        if(first){
            text = rushMinutes_openedFrom
        } else {
            text = rushMinutes_closedAfter
        }

        let firstRenderedText = (
            text+" "+lastTime
        )

        let textBelowPlaceholder = null;
        if(showDetails){
            textBelowPlaceholder = (
                " "
            );
        }

        //let borderColor = active ? this.fontStyles.normal.color : "transparent"; // TODO:

        return renderBar(getItemWidth(), getClosedBarWidth(), "transparent", undefined, textBelowPlaceholder, firstRenderedText, isActive);
    }

    function getTimeKeys(){
        let keys = Object.keys(utilization);
        return keys;
    }

    /**
     * Render Rush Minutes
     * @returns {Array}
     */
    function renderPopularTimeCols(topPosition) {
        if (!utilization) {
            return <Text>{""}</Text>;
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
            if(showDetails){
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

            if(i === 0){
                let openingTime = "" + HH + ":" + mm
                const isActive = activeIndex === -1;
                cols.push(renderClosedBar(true, isActive, openingTime));
            }

            const isFullHour = parseInt(mm) === 0;

            let text = "";
            let renderedText = null;
            let renderedTextInside = "";
            if(showDetails){
                text = isFullHour ? HH : "  ";
                renderedText = (
                    <Text>{text}</Text>
                );
            } else {
                renderedTextInside = isFullHour ? HH : "  ";
            }

            //let bgColor = popularTimeHour === nowHour ? "#FFD500" : "#ffffff";
            let bgColor = getColorForTraffic(value);

            const isActive = i === activeIndex;
            cols.push(
                renderBar(height, width, bgColor, bgColor, renderedText, renderedTextInside, isActive)
            );
        }

        let placeHolderRenderedText = showDetails ? (" ") : null;
        //add empty item to fill the rest of the space

        const isActive = activeIndex === keys.length;
        if(keys.length > 0){
            cols.push(renderClosedBar(false, isActive, lastTime));
        }
        cols.push(renderBar(getItemWidth(), getItemWidth(), "transparent", "transparent", placeHolderRenderedText, undefined, false));

        let scrollViewContent = (
            <View style={{alignItems: "flex-end", flexGrow: 1, flexDirection: "row"}} onPress={() => {
                setShowDetails(!showDetails)
            }} >
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

    function renderBar(height, width, borderColor, bgColor, textBelow, textInside?, isActive){
        return <UtilizationForecastBar height={height} width={width} borderColor={borderColor} bgColor={bgColor} textInside={textInside} textBelow={textBelow} isActive={isActive} />
    }

    const paddingTop = 5;
    const paddingHorizontal = 10;

    return (
        <View style={{width: "100%", paddingBottom: 0}}>
            <View style={{flexDirection: "row"}}>
                <View style={{flex: 1, paddingTop: paddingTop}}>
                    {renderPopularTimeCols(false)}
                </View>
                <View>
                    <TouchableOpacity style={{}} onPress={() => {
                        setShowDetails(!showDetails);
                    }} >
                        <View style={{paddingHorizontal: paddingHorizontal, paddingTop: paddingTop}}>
                            <Icon
                                name={showDetails ? "chevron-up" : "chevron-down"}
                            />
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
