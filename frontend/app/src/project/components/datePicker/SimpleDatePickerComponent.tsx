import React, {FunctionComponent, useState} from "react";
import {ScrollView, Text, Tooltip, View} from "native-base";
import {Dimensions, TouchableOpacity} from "react-native";
import {GridList} from "../GridList";
import {DateHelper, Weekday} from "../../helper/DateHelper";
import {SwitchIcon} from "../icons/SwitchIcon";
import Rectangle from "../../helper/Rectangle";
import {ParentDimension} from "../../helper/ParentDimension";
import {ViewPixelRatio} from "../../helper/ViewPixelRatio";
import {ViewPercentageBorderradius} from "../../helper/ViewPercentageBorderradius";

export interface SimpleDatePickerProps {
    onClose: any
    currentDate?: Date,
    selectedTextColor?: any,
    selectedDateColor?: any,
    weekdayBackgroundColor?: any,
    weekdayTextColor?: any,
    onSelectDate?: any,
    locale?: string,
    renderDate?: (dateToRender: Date, referenceDate: Date, onClose: any, emptyRow: boolean) => any,
    yearTranslation?: string,
    monthTranslation?: string,
    selectedTranslation?: string,
}
export const SimpleDatePickerComponent: FunctionComponent<SimpleDatePickerProps> = (props) => {

    const defaultBackgroundColor = "orange";
    const defaultSelectedColor = "white";

    const onClose = props?.onClose;
    const translatedWordYear = props?.yearTranslation || "Year";
    const translatedWordMonth = props?.monthTranslation || "Month";
    const selectedTranslation = props?.selectedTranslation || "Selected";

    const locale = props?.locale;
    const weekStartsAtDay = DateHelper.Weekday.MONDAY; // 0=Sunday 1=Monday

    const windowHeight = Dimensions.get('screen').height;
    const maxHeight = windowHeight*0.5;

    const amountDaysPerWeek = 7;
    const amountCalendarCurrentMonthRows = 4;
    const amountCalendarPreviousMonthRows = 1;
    const amountCalendarNextMonthRows = 1;
    const amountCalendarDateRows = amountCalendarCurrentMonthRows+amountCalendarPreviousMonthRows+amountCalendarNextMonthRows;

    const [monthDimension, setMonthDimension] = useState({width: undefined, height: undefined})
    const [dimension, setDimension] = useState({width: undefined, height: undefined})
    let smalledDimension = undefined;
    if(dimension?.height < smalledDimension || !smalledDimension){
        smalledDimension = dimension.height
    }
    if(dimension?.width < smalledDimension || !smalledDimension){
        smalledDimension = dimension.width
    }

    const currentDate = props?.currentDate || new Date();
    const [shownDateString, setShownDate] = useState(currentDate);

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
                    <Tooltip label={tooptip}>
                        <View style={{justifyContent: "center", alignItems: "center"}}>
                            <Text accessibilityLabel={accessibilityLabel} color={textColor}>{weekDayShortChar}</Text>
                        </View>
                    </Tooltip>
                </View>
            )
        }
        return output;
    }

    function renderDefaultDayInMonth(dateToRender: Date, referenceDate: Date, onClose){
        let style = {
            opacity: undefined,
            backgroundColor: undefined
        }



        const text = dateToRender.getDate()+"";

        let monthOfDateToRender = dateToRender.getMonth();
        let monthOfReferenceDate = referenceDate.getMonth();

        let textColor = undefined;

        if(monthOfReferenceDate!==monthOfDateToRender){
            style.opacity = 0.5;
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

        return (
            <Tooltip label={tooltip}>
                <TouchableOpacity
                    accessibilityLabel={accessibilityLabel}
                    onPress={() => {
                        if(props?.onSelectDate){
                            props?.onSelectDate(dateToRender)
                        }
                        if(!!onClose){
                            onClose();
                        }
                    }}
                    style={[{justifyContent: "center", alignItems: "center", flex: 1}]}>
                            <ViewPercentageBorderradius style={[{borderRadius: "100%" ,width: "100%", justifyContent: "center", alignItems: "center", flex: 1}, style]}>
                                    <Text color={textColor} >{text}</Text>
                            </ViewPercentageBorderradius>
                </TouchableOpacity>
            </Tooltip>
        );
    }

    function renderDayInMonth(dateToRender: Date, referenceDate: Date, onClose, emptyRow: true){
        let content = null;

        if(!emptyRow){
            if(!!props?.renderDate){
                content = props?.renderDate(dateToRender, referenceDate, onClose, emptyRow);
            } else {
                content = renderDefaultDayInMonth(dateToRender, referenceDate, onClose);
            }
        }

        return(
            <View style={{flex: 1}}>
                {content}
            </View>
        )
    }

    function renderDaysInMonth(date: Date, firstDayOfWeek: Weekday, onClose){
        //e. G. date=12.10.2022
        let firstDayOfMonth = DateHelper.getFirstDayOfMonth(date);
        let diffToStartWithFirstDayOfWeek = DateHelper.getAmountDaysFromLastMonthForWeekstart(date, firstDayOfWeek)

        let output = [];

        // previous month
        let tempDate = new Date(firstDayOfMonth);
        tempDate.setDate(tempDate.getDate()-diffToStartWithFirstDayOfWeek);
        for(let i=0; i<diffToStartWithFirstDayOfWeek; i++){
            output.push(renderDayInMonth(new Date(tempDate), new Date(date), onClose))
            tempDate.setDate(tempDate.getDate()+1);
        }

        // current month
        let amountDaysInMonth = DateHelper.getAmountDaysInMonth(date);
        tempDate = new Date(firstDayOfMonth);
        for(let i=0; i<amountDaysInMonth; i++){
            output.push(renderDayInMonth(new Date(tempDate), new Date(date), onClose))
            tempDate.setDate(tempDate.getDate()+1);
        }

        // next month
        let diffToEndWithLastDayOfWeekForMonth = DateHelper.getAmountDaysFromNextMonthToWeekend(date, firstDayOfWeek);
        tempDate = DateHelper.getFirstDayOfNextMonth(date);
        for(let i=0; i<diffToEndWithLastDayOfWeekForMonth; i++){
            output.push(renderDayInMonth(new Date(tempDate), new Date(date), onClose))
            tempDate.setDate(tempDate.getDate()+1);
        }

        // In order to maintain the same height for all months we fill the gaps
        while(output.length < amountDaysPerWeek*amountCalendarDateRows){
            output.push(renderDayInMonth(null, null, null, true))
        }

        return output;
    }

    function renderAllDaysInMonth(date: Date, onClose){
        let output = [];
        output = output.concat(renderDaysInMonth(date, weekStartsAtDay, onClose));

        return (
            <View style={{width: "100%", flex: 1}}>
                <GridList
                    paddingHorizontal={"0%"}
                    paddingVertical={"0%"}
                    beakpointsColumns={{
                        base: amountDaysPerWeek
                    }}
                    style={{flex: 1}} >
                    {output}
                </GridList>
            </View>
        )
    }

    function renderSwitchYear(shownDate: Date, forward){
        let yearDiff = forward ? 1 : -1

        return(
            <SwitchIcon accessibilityName={translatedWordYear} forward={forward} onPress={() => {
                let nextDate = new Date(shownDate);
                nextDate.setFullYear(nextDate.getFullYear()+yearDiff)
                setShownDate(nextDate.toISOString())
            }} />
        )
    }

    function renderSwitchYearRow(shownDate: Date){
        return renderRow(
            renderSwitchYear(shownDate, false),
            <Text>{shownDate.getFullYear()}</Text>,
            renderSwitchYear(shownDate, true)
        )
    }

    function renderSwitchMonth(shownDate: Date, forward){
        let monthDiff = forward ? 1 : -1

        return(
            <SwitchIcon accessibilityName={translatedWordMonth} forward={forward} onPress={() => {
                let nextDate = new Date(shownDate);
                nextDate.setMonth(nextDate.getMonth()+monthDiff)
                setShownDate(nextDate.toISOString())
            }} />
        );
    }

    function renderRow(...children){
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
            renderSwitchMonth(shownDate, false),
            <Text>{monthName}</Text>,
            renderSwitchMonth(shownDate, true)
        )
    }

    function renderContent(onClose){
        if(!!smalledDimension){
            return(
                <View style={{height: smalledDimension, width: smalledDimension}}>
                    {renderSwitchYearRow(shownDate)}
                    {renderSwitchMonthRow(shownDate)}
                    {renderRow(
                        ...renderWeekdayRowForMonth()
                    )}
                    {renderAllDaysInMonth(shownDate, onClose)}
                </View>
            )
        } else {
            return null
        }
    }

    function renderDatePickerComponent(){
        return(
            <ScrollView style={{width: "100%"}}>
                <View style={{height: maxHeight, width: "100%"}}>
                    <ParentDimension style={{height: maxHeight, width: "100%", alignItems: "center"}} setDimension={(x, y, width, height) => {
                        setDimension({width: width, height: height})
                    }} >
                        {renderContent(onClose)}
                    </ParentDimension>

                </View>
            </ScrollView>
        )
    }

    return(
        renderDatePickerComponent(onClose)
    )
}
