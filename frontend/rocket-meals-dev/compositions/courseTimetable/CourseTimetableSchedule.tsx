// @ts-nocheck
import React, {FunctionComponent, useEffect, useRef, useState} from "react";
import {ScrollView, Text, View} from "native-base";
import Timetable from "react-native-calendar-timetable";
import {DateHelper, Weekday} from "../../helper/DateHelper";
import {CourseTimetableItemCard} from "./CourseTimetableItemCard";
import {DirectusTranslationHelper} from "../translations/DirectusTranslationHelper";

type MarkerTime =`${number| ''}${number}:${number}${number}`
export interface TimetableEvent {
    id?: string,
    title: string,
    location: string,
    color: string,
    start: MarkerTime,
    end: MarkerTime,
    weekday: Weekday
}

interface AppState {
    renderHeader?: (date: Date, start: Date, end: Date) => any;
    locale?: string;
    backgroundColor?: string;
    amountOfDays?: number;
    amountOfDaysToShowOnScreen?: number;
    weekStartsOn?: Weekday;
    currentWeekday?: Weekday;
    events?: TimetableEvent[];
    fromHour?: number;
    toHour?: number;
    renderTime?: (fromHour, toHour) => any;
    renderEvent?: (event, start, end, isSelected) => any;
}
export const CourseTimetableSchedule: FunctionComponent<AppState> = (props) => {

    const scrollViewRef = useRef(null);

    const [dimension, setDimension] = useState({width: undefined, height: undefined});
    const width = dimension?.width;

    const backgroundColor = props?.backgroundColor || "transparent"

    const locale = props?.locale || DirectusTranslationHelper.DEFAULT_LANGUAGE_CODE;

    const fromWeekday = props?.weekStartsOn || Weekday.MONDAY;

    let indexToStart = 0;
    if (props?.currentWeekday) {
        const currentWeekday = props?.currentWeekday;
        let indexDifference = DateHelper.getWeekdayDifference(fromWeekday, currentWeekday);
        if(indexDifference < 0){ // if the current weekday is before the first weekday of the week
            indexDifference += 7; // add 7 to get the correct index
        }
        indexToStart = indexDifference;
    }

    const [from] = React.useState(DateHelper.getDefaultWeekdayDate(fromWeekday));
    let amountOfDays = props?.amountOfDays || 7;

    const defaultAmountOfDaysToShowOnScreen = 7;
    let amountOfDaysToShowOnScreen = props?.amountOfDaysToShowOnScreen || defaultAmountOfDaysToShowOnScreen;

    const [till] = React.useState(DateHelper.addDays(new Date(from), amountOfDays-1).toISOString());
    const fromHour = props?.fromHour || 0;
    const toHour = props?.toHour || 24;
    const range = {from: from, till: till};

    const hourHeight = 60;
    const columnHeaderHeight = hourHeight / 2;
    let timeWidth = 60;
    const linesTopOffset = 18;

    const columnWidth = (width / amountOfDaysToShowOnScreen)-(timeWidth/amountOfDaysToShowOnScreen)-10/amountOfDaysToShowOnScreen;

    const items = props?.events || [];

    // corresponding componentDidMount
    useEffect(() => {
        //
    }, [props?.route?.params])

    function renderHeader({date, start, end}){
        let startDate = new Date(start);
        let endDate = new Date(end);

        let renderHeader = props?.renderHeader;
        if(renderHeader){
            return renderHeader(date, startDate, endDate);
        }

        let weekday = DateHelper.getWeekdayNameByDate(startDate, locale);
        return (
            <View>
                <Text>{weekday}</Text>
            </View>
        )
    }

    function renderTime(fromHour, toHour){
        let hour = fromHour < 10 ? "0"+fromHour : fromHour;
        return(
            <View style={{height: hourHeight, width: "100%", justifyContent: "flex-start", alignItems: "flex-end", backgroundColor: backgroundColor}}>
                <View style={{backgroundColor: "transparent"}}>
                    <Text>{(hour)+":00"}</Text>
                </View>
            </View>
        )
    }

    function renderTimes(fromHour, toHour){
        let output = [];
        for(let i = fromHour; i < toHour; i++){
            output.push(
                renderTime(i, i+1)
            )
        }
        return output;
    }

    function renderTimeColumns(){
        //return null;

        return(
            <View style={{position: "absolute", top: columnHeaderHeight+18, left: 0, height: "100%", width: timeWidth}}>
                {renderTimes(fromHour, toHour)}
            </View>
        )
    }

    function renderTimetable(){
        if(!width){
            return null;
        } else {
            // to fix inside view columnWidth = (width / amountOfDays)-(timeWidth/amountOfDays)-10/amountOfDays
            return (
                <>
                <ScrollView>
                    <Timetable
                        scrollViewProps={{
                            ref: scrollViewRef,
                        }}
                        style={{
                            timeContainer: {
                                backgroundColor: "transparent",
                                display: "none"
                            },
                            nowLine: {
                                dot: {
                                    backgroundColor: "red",
                                },
                                line: {
                                    backgroundColor: "red",
                                }
                            },
                        }}
                        width={width}
                        // these two are required
                        items={items}
                        cardComponent={CourseTimetableItemCard}
                        renderHeader={renderHeader}
                        enableSnapping={true}
                        fromHour={fromHour}
                        toHour={toHour}

                        linesLeftInset={0}
                        linesTopOffset={18}
                        columnHorizontalPadding={5}

                        // provide only one of these if you need to
                        range={range} // optional
                        columnWidth={columnWidth}
                        timeWidth={timeWidth}
                    />
                    {renderTimeColumns()}
                </ScrollView>
                </>
            )
        }
    }

    //console.log("rendering timetable")

    useEffect(() => {
        if (scrollViewRef?.current) {
            //console.log("scroll to start");
            const x = indexToStart * columnWidth;
            const y = 0;
            scrollViewRef.current.scrollTo({x, y, animated: true});
        } else {
            //console.log("scroll to start failed");
        }
    }, [dimension]);

  return (
       <View style={{width: "100%", height: "100%", flex: 1}}>
           <View style={{width: "100%", height: "100%"}} onLayout={(event) => {
               const {x, y, width, height} = event.nativeEvent.layout;
               setDimension({width: width, height: height})
           }}>
               {renderTimetable()}
           </View>
       </View>
  )
}
