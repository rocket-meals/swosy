// @ts-nocheck
import React, {FunctionComponent} from "react";
import {Text, View} from "native-base";
import {TimetableEvent} from "./CourseTimetableSchedule";
import {TouchableOpacity} from "react-native";
import {Navigation} from "../../../kitcheningredients";
import {useCourseTimetableEvents, usePersonalCourseTimetableTitleIntelligent} from "./CourseTimetableHelper";
import {CourseTimetableEvent} from "../../screens/courseTimetable/CourseTimetableEvent";
import {MyTouchableOpacity} from "../buttons/MyTouchableOpacity";
import {MyTouchableOpacityForNavigation} from "../buttons/MyTouchableOpacityForNavigation";
import {ColorHelper} from "../../helper/ColorHelper";

interface AppState {
    style: any,
    item: any,
    dayIndex: any,
    daysTotal: any
}
export const CourseTimetableItemCard: FunctionComponent<AppState> = (props) => {

    let item: TimetableEvent = props?.item;
    const id = item?.id || "";

    const [timetableEvents, setTimetableEvents] = useCourseTimetableEvents();
    const event = timetableEvents[id];

    const [titleIntelligent, setTitleIntelligent] = usePersonalCourseTimetableTitleIntelligent();

    const style = props?.style || {};

    const location = event?.location || "";
    const color = event?.color || "red";

    const start = event?.start || "";
    const end = event?.end || "";

    const colorContrast = ColorHelper.useContrastColor(color);

    const headerText = start + " - " + end + ", " + location;

    function getTitle(event, titleIntelligent){
        const title = event?.title || "";
        if(titleIntelligent){
            // split the title by the first opening bracket
            const split = title.split("(");
            return split[0];
        }
        return title;
    }

    const title = getTitle(event, titleIntelligent) || location;


    return (
        <View style={{
            ...style, // apply calculated styles, be careful not to override these accidentally (unless you know what you are doing)
        }}>
            <MyTouchableOpacityForNavigation accessibilityLabel={title} style={{height: "100%", width: "100%"}} onPress={() => {
                Navigation.navigateTo(CourseTimetableEvent, {id: id, showbackbutton: true});
            }}>
                <View style={{
                    height: "100%",
                    width: "100%",
                    //...style, // apply calculated styles, be careful not to override these accidentally (unless you know what you are doing)
                    backgroundColor: color, // apply custom background color
                    borderRadius: 10,
                    elevation: 5,
                    overflow: "hidden"
                }}>
                    <View><Text color={colorContrast} numberOfLines={2} italic={true}>{headerText}</Text></View>
                    <View style={{width: "100%", height: 1, backgroundColor: colorContrast}}/>
                    <View><Text color={colorContrast} numberOfLines={6} bold={true}>{title}</Text></View>
                </View>
            </MyTouchableOpacityForNavigation>
        </View>
    );
}
