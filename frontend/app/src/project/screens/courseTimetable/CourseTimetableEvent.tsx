import React, {FunctionComponent} from "react";
import {Text, View} from "native-base";
import {ProfileAPI, useSynchedProfile} from "../../components/profile/ProfileAPI";
import {Navigation} from "../../../kitcheningredients";
import {useCourseTimetableEvents} from "../../components/courseTimetable/CourseTimetableHelper";
import {SettingsRowTextEditComponent} from "../../components/settings/SettingsRowTextEditComponent";
import {SettingsRowWeekday} from "../../components/settings/SettingsRowWeekday";
import {SettingsRowTimeEditComponent} from "../../components/settings/SettingsRowTimeEditComponent";
import {SettingsRow} from "../../components/settings/SettingsRow";
import {IdIcon} from "../../components/icons/IdIcon";
import {NameIcon} from "../../components/icons/NameIcon";
import {ColorIcon} from "../../components/icons/ColorIcon";
import {TimeStartIcon} from "../../components/icons/TimeStartIcon";
import {TimeEndIcon} from "../../components/icons/TimeEndIcon";
import {SettingsSpacer} from "../../components/settings/SettingsSpacer";
import {DeleteIcon} from "../../components/icons/DeleteIcon";
import {AppTranslation, useAppTranslation} from "../../components/translations/AppTranslation";
import {SaveIcon} from "../../components/icons/SaveIcon";
import {TouchableOpacityIgnoreChildEvents} from "../../helper/overlay/TouchableOpacityIgnoreChildEvents";
import {CourseTimetable} from "./CourseTimetable";
import {SettingsRowColorEditComponent} from "../../components/settings/SettingsRowColorEditComponent";

interface AppState {

}

export const CourseTimetableEvent: FunctionComponent<AppState> = (props) => {

    const params = props?.route?.params || {};

    const newEvent = params?.newEvent || false;

    const id = params?.id;
    const [timetableEvents, setTimetableEvents, addNewCourseTimetableEvent] = useCourseTimetableEvents();
    const [event, setEvent] = React.useState(timetableEvents?.[id] || {});

    const requiredFields = ["start", "end"];

    const requiredFieldsFilled = areRequiredFieldsSet(event, requiredFields);

    const color = event?.color || "red";

    const translationEvent = useAppTranslation("event");
    const translationDelete = useAppTranslation("delete");
    const translationLocation = useAppTranslation("location");
    const translationTitle = useAppTranslation("title");
    const translationWeekday = useAppTranslation("weekday");
    const translationStart = useAppTranslation("start");
    const translationEnd = useAppTranslation("end");
    const translationColor = useAppTranslation("color");

    const translationSave = useAppTranslation("save");
    const translationCancel = useAppTranslation("cancel");

    function areRequiredFieldsSet(event, requiredFields){
        let result = true;
        requiredFields.forEach((field) => {
            if(!event?.[field]){
                result = false;
            }
        });
        return result;
    }

    async function handleDelete(){
        // delete the event from the timetableEvents with the id
        delete timetableEvents[id];
        // update the timetableEvents
        let success = await setTimetableEvents(timetableEvents);
        if(success){
            Navigation.navigateTo(CourseTimetable);
        }
    }

    async function changeFieldValue(field, value){
        // update the event with the new value
        let eventCopy = {...event};
        eventCopy[field] = value;
        if(!newEvent){
            // update the timetableEvents
            timetableEvents[id] = eventCopy;
            let success = await setTimetableEvents(timetableEvents);
            return success;
        } else {
            setEvent(JSON.parse(JSON.stringify(eventCopy)));
        }
        return true;
    }

    function renderTextEditRow(field, description, icon){
        let initialValue = event?.[field];

        return <SettingsRowTextEditComponent
            icon={icon}
            description={description}
            onChange={changeFieldValue.bind(null, field)}
            initialValue={initialValue}
            placeholder={initialValue}
            saveText={translationSave}
            cancelText={translationCancel}  />
    }

    function renderWeekdayEditRow(field, description){
        const [profile, setProfile] = useSynchedProfile();
        const locale = ProfileAPI.getLocaleForJSDates(profile);

        const value = event?.[field];

        return(
            <SettingsRowWeekday weekday={value} onChange={(value) => {
                changeFieldValue(field, value);
            }} description={description} locale={locale} />
        )
    }

    function renderTimeEditRow(field, description, icon){
        let initialValue = event?.[field];

        return <SettingsRowTimeEditComponent
            icon={icon}
            description={description}
            onChange={changeFieldValue.bind(null, field)}
            initialValue={initialValue}
            placeholder={"HH:MM"}
            saveText={translationSave}
            cancelText={translationCancel}  />
    }

    function renderColorEditRow(field, description, icon){
        let initialColor = event?.[field];

        return <SettingsRowColorEditComponent
            icon={icon}
            description={description}
            onChange={async (newColor) => {
                //console.log("newColor", newColor);
                return await changeFieldValue(field, newColor);
            }}
            initialColor={initialColor}
        />
    }

    async function saveNewEvent(){
        let success = await addNewCourseTimetableEvent(event);
        if(success){
            Navigation.navigateTo(CourseTimetable);
        }
    }

    let content = [];
    if(!newEvent){
        content.push(<SettingsRow leftContent={"ID"} leftIcon={<IdIcon />} rightContent={id+""} />)
    }


    content.push(renderTextEditRow("title", translationTitle, <NameIcon />));
    content.push(renderTextEditRow("location", translationLocation, <NameIcon />));
    content.push(renderColorEditRow("color", translationColor, <ColorIcon />));
    content.push(renderTimeEditRow("start", translationStart, <TimeStartIcon />));
    content.push(renderTimeEditRow("end", translationEnd, <TimeEndIcon />));
    content.push(renderWeekdayEditRow("weekday", translationWeekday));
    content.push(<SettingsSpacer/>)


    if(!newEvent){
        content.push(<SettingsRow leftContent={translationDelete} leftIcon={<DeleteIcon />} onPress={handleDelete} />)
    } else {
        const createRow = <SettingsRow leftContent={translationEvent+": "+translationSave} leftIcon={<SaveIcon />} onPress={saveNewEvent} />
        if(requiredFieldsFilled){
            content.push(createRow);
        } else {
            content.push(<TouchableOpacityIgnoreChildEvents style={{cursor: "not-allowed"}} useDefaultOpacity={true}>{createRow}</TouchableOpacityIgnoreChildEvents>)
        }
    }

    return (
        <View style={{width: "100%", alignItems: "center"}}>
            <View style={{width: "100%"}}>
                {content}
            </View>
        </View>
    )

}
