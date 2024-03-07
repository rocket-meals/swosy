import React, {FunctionComponent, useState} from "react";
import {ListRenderItemInfo} from "react-native";
import {DateHelper, Weekday} from "@/helper/date/DateHelper";
import {Text, View} from "@/components/Themed";
import {MyTouchableOpacity} from "@/components/buttons/MyTouchableOpacity";
import {MyPreviousNextButton} from "@/components/buttons/MyPreviousNextButton";
import {ViewStyle} from "react-native/Libraries/StyleSheet/StyleSheetTypes";
import {StyleProp} from "react-native/Libraries/StyleSheet/StyleSheet";
import {MyGridFlatList} from "@/components/grid/MyGridFlatList";

export interface SimpleDatePickerProps {
    currentDate?: Date,
    textColor?: any,
    lighterOrDarkerTextColor?: any,
    selectedTextColor?: any,
    selectedDateColor?: any,
    weekdayBackgroundColor?: any,
    weekStartsAtDay: Weekday,
    weekdayTextColor?: any,
    onSelectDate?: (date: Date) => void,
    locale?: string,
    renderDate?: (dateToRender: Date | null, referenceDate: Date | null, emptyRow: boolean) => any,
    yearTranslation?: string,
    monthTranslation?: string,
    selectedTranslation?: string,
}
export const SimpleDatePickerComponent: FunctionComponent<SimpleDatePickerProps> = (props) => {

    const defaultBackgroundColor = "orange";
    const defaultSelectedColor = "white";

    const translatedWordYear = props?.yearTranslation || "Year";
    const translatedWordMonth = props?.monthTranslation || "Month";
    const selectedTranslation = props?.selectedTranslation || "Selected";

    const locale = props?.locale;
    const weekStartsAtDay = props.weekStartsAtDay

    const amountDaysPerWeek = 7;
    const amountCalendarCurrentMonthRows = 4;
    const amountCalendarPreviousMonthRows = 1;
    const amountCalendarNextMonthRows = 1;
    const amountCalendarDateRows = amountCalendarCurrentMonthRows+amountCalendarPreviousMonthRows+amountCalendarNextMonthRows;

    const currentDateFromProps = props?.currentDate;
    const currentDate = currentDateFromProps ? new Date(currentDateFromProps) : new Date(); // make a copy if currentDateFromProps is a hookValue and to remove side effects
    const [shownDateString, setShownDate] = useState<string>(currentDate.toISOString());

    const shownDate = new Date(shownDateString);

    function renderWeekdayRowForMonth(){
        let output = [];
        let weekDayShortChars = DateHelper.getWeekdayNamesFirstLetters(locale, weekStartsAtDay);
        let weekDayNamesLong = DateHelper.getWeekdayNames(locale, weekStartsAtDay);

        let backgroundColor = props?.weekdayBackgroundColor || defaultBackgroundColor;
        let textColor = props?.weekdayTextColor || defaultSelectedColor

        for(let i = 0; i < amountDaysPerWeek; i++){
            let weekDayName = weekDayNamesLong[i];
            let weekDayShortChar = weekDayShortChars[i];

            const tooptip = weekDayName;
            const accessibilityLabel = weekDayName;


            output.push(
                <View style={{width: "100%", backgroundColor: backgroundColor}}>
                    <View style={{justifyContent: "center", alignItems: "center"}}>
                        <Text accessibilityLabel={accessibilityLabel} style={{color: textColor}}>{weekDayShortChar}</Text>
                    </View>
                </View>
            )
        }
        return output;
    }

    function renderDefaultDayInMonth(index: number, dateToRender: Date | null, referenceDate: Date | null){
        let style: StyleProp<ViewStyle> = {
            opacity: undefined,
            backgroundColor: undefined
        }

        if(!dateToRender || !referenceDate){
            return <View style={{flex: 1}} key={index+""} />
        }

        const text = dateToRender.getDate()+"";

        let monthOfDateToRender = dateToRender.getMonth();
        let monthOfReferenceDate = referenceDate.getMonth();

        let textColor: string | undefined = props.textColor;

        if(monthOfReferenceDate!==monthOfDateToRender){
            if(!!props.lighterOrDarkerTextColor){
                textColor = props.lighterOrDarkerTextColor
            } else {
                style.opacity = 0.5;
            }
        }

        const weekdayName = DateHelper.getWeekdayNameByDate(dateToRender, locale)
        let tooltip = weekdayName + " "+ DateHelper.formatOfferDateToReadable(dateToRender, true);


        let isSelected = dateToRender.toISOString()===referenceDate.toISOString()
        if(isSelected){
            style.backgroundColor = props?.selectedDateColor || defaultBackgroundColor;
            textColor = props?.selectedTextColor || defaultSelectedColor;
            tooltip = selectedTranslation + ": " + tooltip;
        }

        const accessibilityLabel = tooltip;

        let renderedCircle = (
            <View style={[{borderRadius: 15 ,width: "100%", justifyContent: "center", alignItems: "center", flex: 1}, style]}>
                <Text style={{color: textColor}} >{text}</Text>
            </View>
        )

        return (
            <View style={{justifyContent: "center", alignItems: "center",
                height: 50, width: "100%", flexDirection: "row"
            }}>
                <MyTouchableOpacity
                    key={dateToRender.toISOString()}
                    accessibilityLabel={accessibilityLabel}
                    onPress={() => {
                        if(props?.onSelectDate){
                            props?.onSelectDate(dateToRender)
                        }
                    }}
                    style={[{justifyContent: "center", alignItems: "center", flex: 1, height: "100%", width: "100%"
                    }]}>
                    {renderedCircle}
                </MyTouchableOpacity>
            </View>
        )
    }

    function renderDayInMonth(index: number, dateToRender: Date | null, referenceDate: Date | null, emptyRow: boolean){
        let content = null;

        if(!emptyRow){
            if(!!props?.renderDate){
                content = props?.renderDate(dateToRender, referenceDate, emptyRow);
            } else {
                content = renderDefaultDayInMonth(index, dateToRender, referenceDate);
            }
        }

        return(
            <View style={{flex: 1}}>
                {content}
            </View>
        )
    }

    function renderDaysInMonth(date: Date, firstDayOfWeek: Weekday): (Date | null)[]
    {
        //e. G. date=12.10.2022
        let firstDayOfMonth = DateHelper.getFirstDayOfMonth(date);
        let diffToStartWithFirstDayOfWeek = DateHelper.getAmountDaysFromLastMonthForWeekstart(date, firstDayOfWeek)

        let output: (Date | null)[] = [];

        // previous month
        let tempDate = new Date(firstDayOfMonth);
        tempDate.setDate(tempDate.getDate()-diffToStartWithFirstDayOfWeek);
        for(let i=0; i<diffToStartWithFirstDayOfWeek; i++){
            output.push(new Date(tempDate))
            tempDate.setDate(tempDate.getDate()+1);
        }

        // current month
        let amountDaysInMonth = DateHelper.getAmountDaysInMonth(date);
        tempDate = new Date(firstDayOfMonth);
        for(let i=0; i<amountDaysInMonth; i++){
            output.push(new Date(tempDate))
            tempDate.setDate(tempDate.getDate()+1);
        }

        // next month
        // In order to maintain the same height for all months we fill the gaps
        let maxItemsInCalendarDisplay = amountDaysPerWeek*amountCalendarDateRows
        tempDate = DateHelper.getFirstDayOfNextMonth(date);
        while(output.length < maxItemsInCalendarDisplay){
            output.push(new Date(tempDate))
            tempDate.setDate(tempDate.getDate()+1);
        }

        return output;
    }

    function renderAllDaysInMonth(date: Date){
        let output: (Date | null)[] = renderDaysInMonth(date, weekStartsAtDay);

        type DataItem = { key: string; data: Date | null; }
        let outputWithKeys: DataItem[] = []
        for(let i=0; i<output.length; i++){
            outputWithKeys.push({key: i+"", data: output[i]})
        }

        return (
            <View style={{width: "100%", flex: 1
            }}>
                <MyGridFlatList
                    spacing={{
                        marginInner: 0,
                        marginOuter: 0,
                        marginRow: 0,
                        marginTop: 0
                    }}
                    data={outputWithKeys}
                    renderItem={(info: ListRenderItemInfo<DataItem>) => {
                        const {item, index} = info;
                        const dateToRender = item.data;
                        if(!dateToRender){
                            return renderDayInMonth(index, null, null, true)
                        } else {
                            return renderDayInMonth(index, dateToRender, shownDate, false)
                        }
                    }}
                    gridAmount={amountDaysPerWeek}
                     >
                </MyGridFlatList>
            </View>
        )
    }

    function renderSwitchYear(shownDate: Date, forward: boolean){
        let yearDiff = forward ? 1 : -1

        return(
            <View style={{
                justifyContent: "center",
                alignItems: "center",
                flex: 1,
            }}>
                <MyPreviousNextButton translation={translatedWordYear} forward={forward} onPress={() => {
                    let nextDate = new Date(shownDate);
                    nextDate.setFullYear(nextDate.getFullYear()+yearDiff)
                    setShownDate(nextDate.toISOString())
                }} />
            </View>
        )
    }

    function renderSwitchYearRow(shownDate: Date){
        return renderRow(
            [
                renderSwitchYear(shownDate, false),
                <Text>{shownDate.getFullYear()}</Text>,
                renderSwitchYear(shownDate, true)
            ]
        )
    }

    function renderSwitchMonth(shownDate: Date, forward: boolean){
        let monthDiff = forward ? 1 : -1

        return(
            <View style={{
                justifyContent: "center",
                alignItems: "center",
                flex: 1,
            }}>
                <MyPreviousNextButton translation={translatedWordMonth} forward={forward} onPress={() => {
                    let nextDate = new Date(shownDate);
                    nextDate.setMonth(nextDate.getMonth()+monthDiff)
                    setShownDate(nextDate.toISOString())
                }} />
            </View>
        );
    }

    function renderRow(children: React.ReactNode[]){
        let output = [];
        for(let child of children){
            output.push(
                <View style={{flex: 1, flexGrow: 1, justifyContent: "center", alignItems: "center"}}>
                    {child}
                </View>
            )
        }

        return (
            <View style={{justifyContent: "center", alignItems: "center", flexDirection: "row", width: "100%"}}>
                {output}
            </View>
        )
    }

    function renderSwitchMonthRow(shownDate: Date){
        let monthName = DateHelper.getMonthName(shownDate, locale)

        return renderRow(
            [
                renderSwitchMonth(shownDate, false),
                <Text>{monthName}</Text>,
                renderSwitchMonth(shownDate, true)
            ]
        )
    }

    function renderDatePickerComponent(){
        return(
                <View style={{width: "100%"}}>
                    {renderSwitchYearRow(shownDate)}
                    {renderSwitchMonthRow(shownDate)}
                    <View style={{
                        height: 50,
                    }}></View>
                    {renderRow(renderWeekdayRowForMonth())}
                    {renderAllDaysInMonth(shownDate)}
                </View>
        )
    }

    return(
        renderDatePickerComponent()
    )
}
