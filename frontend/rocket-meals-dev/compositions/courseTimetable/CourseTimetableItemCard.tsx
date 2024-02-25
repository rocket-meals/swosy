import React, {FunctionComponent} from "react";
import {
    CourseTimetableEventType,
    useCourseTimetableEvents,
    usePersonalCourseTimetableTitleIntelligent
} from "@/compositions/courseTimetable/CourseTimetableHelper";
import {useMyContrastColor} from "@/helper/color/MyContrastColor";
import {View, Text} from "@/components/Themed";
import {MyTouchableOpacity} from "@/components/buttons/MyTouchableOpacity";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {AccessibilityRole} from "react-native";
import {MyAccessibilityRoles} from "@/helper/accessibility/MyAccessibilityRoles";

interface AppState {
    style: any,
    item: CourseTimetableEventType,
    onPress?: (item: CourseTimetableEventType) => void,
    dayIndex: any,
    daysTotal: any
}
export const CourseTimetableItemCard: FunctionComponent<AppState> = (props) => {

    let item: CourseTimetableEventType = props.item;
    const id = item?.id || "";

    const translationEvent = useTranslation(TranslationKeys.event);
    const translationEdit = useTranslation(TranslationKeys.edit);

    const [timetableEvents, setTimetableEvents] = useCourseTimetableEvents();
    const event = timetableEvents[id];

    const [titleIntelligent, setTitleIntelligent] = usePersonalCourseTimetableTitleIntelligent();

    const style = props?.style || {};

    const location = event?.location || "";
    const color = event?.color || "#FF0000";

    const start = event?.start || "";
    const end = event?.end || "";

    const colorContrast = useMyContrastColor(color)

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

    const accessibilityLabel = translationEvent + ": "+ translationEdit + ": " + title + " " + headerText;
    const tooltip = translationEvent + ": "+ translationEdit

    return (
        <View style={{
            ...style, // apply calculated styles, be careful not to override these accidentally (unless you know what you are doing)
        }}>
            <MyTouchableOpacity tooltip={tooltip} accessibilityLabel={accessibilityLabel} style={{height: "100%", width: "100%"}} onPress={() => {
                if(props.onPress) {
                    props.onPress(item);
                }
            }}>
                <View style={{
                    height: "100%",
                    width: "100%",
                    //...style, // apply calculated styles, be careful not to override these accidentally (unless you know what you are doing)
                    backgroundColor: color, // apply custom background color
                    borderRadius: 10,
                    padding: 5,
                    elevation: 5,
                    overflow: "hidden"
                }}>
                    <View><Text style={{color: colorContrast}} numberOfLines={2} italic={true}>{headerText}</Text></View>
                    <View style={{width: "100%", height: 1, backgroundColor: colorContrast}}/>
                    <View><Text style={{color: colorContrast}} numberOfLines={6} bold={true}>{title}</Text></View>
                </View>
            </MyTouchableOpacity>
        </View>
    );
}
