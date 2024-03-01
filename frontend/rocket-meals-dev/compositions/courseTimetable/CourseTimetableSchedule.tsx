import React, {FunctionComponent, useEffect, useRef, useState} from "react";
import Timetable from "react-native-calendar-timetable";
import {CourseTimetableItemCard} from "./CourseTimetableItemCard";
import {CourseTimetableEventType, CourseTimetableDictType} from "@/compositions/courseTimetable/CourseTimetableHelper";
import {DateHelper, Weekday} from "@/helper/date/DateHelper";
import {DirectusTranslationHelper} from "@/helper/translations/DirectusTranslationHelper";
import {CardProps} from "react-native-calendar-timetable/lib/types";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {View, Text} from "@/components/Themed";

interface AppState {
    renderHeader?: (date: Date, start: Date, end: Date) => any;
    locale?: string;
    backgroundColor?: string;
    amountOfDays?: number;
    amountOfDaysToShowOnScreen?: number;
    weekStartsOn?: Weekday;
    currentWeekday?: Weekday;
    eventsDict?: CourseTimetableDictType;
    onPressEvent?: (event: CourseTimetableEventType) => void,
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

    const propsLocale: string | undefined = props?.locale;
    const locale: string = propsLocale || DirectusTranslationHelper.DEFAULT_LANGUAGE_CODE_GERMAN;

    const fromWeekday = props?.weekStartsOn || Weekday.MONDAY;

    let indexToStart = 0;
    if (props?.currentWeekday) {
        const currentWeekday: Weekday = props?.currentWeekday as Weekday;
        let indexDifference = DateHelper.getWeekdayDifference(fromWeekday, currentWeekday);
        if(indexDifference < 0){ // if the current weekday is before the first weekday of the week
            indexDifference += 7; // add 7 to get the correct index
        }
        indexToStart = indexDifference;
    }

    const [fromIsoString] = React.useState(DateHelper.getDefaultWeekdayDate(fromWeekday).toISOString());
    const from = new Date(fromIsoString);
    let amountOfDays = props?.amountOfDays || 7;

    const defaultAmountOfDaysToShowOnScreen = 7;
    let amountOfDaysToShowOnScreen = props?.amountOfDaysToShowOnScreen || defaultAmountOfDaysToShowOnScreen;

    const [tillIsoString] = React.useState(DateHelper.addDays(new Date(from), amountOfDays-1).toISOString());
    const till = new Date(tillIsoString);
    const fromHour = props?.fromHour || 0;
    const toHour = props?.toHour || 24;
    const range = {from: from, till: till};

    const hourHeight = 60;
    const columnHeaderHeight = hourHeight / 2;
    let timeWidth = 60;
    const linesTopOffset = 18;

    const columnWidth = (width / amountOfDaysToShowOnScreen)-(timeWidth/amountOfDaysToShowOnScreen)-10/amountOfDaysToShowOnScreen;

    function getEvent(id: string, start: string, end: string, weekday: Weekday){
        let useDate = DateHelper.getDefaultWeekdayDate(weekday)
        let startDate = new Date(useDate);
        startDate.setHours(parseInt(start.split(":")[0]), parseInt(start.split(":")[1]));
        startDate.setMinutes(startDate.getMinutes()+1)

        let endDate = new Date(useDate);
        endDate.setHours(parseInt(end.split(":")[0]), parseInt(end.split(":")[1]));

        /** Fix timeline display. Since events which start and end at the same time they will share space */
        /** For example 08:00-09:00 and 09:00-10:00 are not overlapping technically */
        /** But we have to reduce the end by 1 minute */
        endDate.setMinutes(endDate.getMinutes()-1); // reduce end by 1 minute

        return{
            id: id,
            startDate: startDate,
            endDate: endDate,
        }
    }

    function parseTimetableEventsToList(timetableEvents: CourseTimetableDictType){
        let events = [];
        let keys = Object.keys(timetableEvents)
        for(let i=0; i<keys.length; i++){
            let key = keys[i];
            let event = timetableEvents[key];
            if(!!event){
                let parsedEvent = getEvent(event.id, event.start, event.end, event.weekday);
                events.push(parsedEvent)
            }
        }
        return events;
    }

    const eventsDict: CourseTimetableDictType = props?.eventsDict || {};

    const items = parseTimetableEventsToList(eventsDict);

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
                <MyScrollView>
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
                         renderItem={
                                ({style, item, dayIndex, daysTotal}: CardProps) => {
                                    const courseTimetableEvent = eventsDict[item.id];
                                    return <CourseTimetableItemCard onPress={props.onPressEvent} dayIndex={dayIndex} daysTotal={daysTotal} item={courseTimetableEvent} style={style} />
                                }
                         }
                    />
                    {renderTimeColumns()}
                </MyScrollView>
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
       <View style={{width: "100%", height: "100%", backgroundColor: "green"}}>
           <View style={{width: "100%", height: "100%"}} onLayout={(event) => {
               const {x, y, width, height} = event.nativeEvent.layout;
               setDimension({width: width, height: height})
           }}>
               {renderTimetable()}
           </View>
       </View>
  )
}
