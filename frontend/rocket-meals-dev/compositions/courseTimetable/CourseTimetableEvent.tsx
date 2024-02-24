import {BaseCourseTimetableEvent, useCourseTimetableEvents} from "@/compositions/courseTimetable/CourseTimetableHelper";
import {FunctionComponent} from "react";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {View, Text} from "@/components/Themed";
import {Weekday} from "@/helper/date/DateHelper";
import {AvailableOption, SettingsRowSelectDayOfWeek} from "@/compositions/settings/SettingsRowSelectDayOfWeek";
import {SettingsRow} from "@/components/settings/SettingsRow";
import {useIsDebug} from "@/states/Debug";

interface AppState {
	item?: BaseCourseTimetableEvent
	handleDelete?: () => {}
	handleEdit?: (usedEvent: BaseCourseTimetableEvent, hide: () =>  void) => void
	handleSave?: () => {}
}

export const CourseTimetableEvent: FunctionComponent<AppState> = (props) => {

	let usedEvent: BaseCourseTimetableEvent = {
		title: "New Event",
		end: "10:00",
		start: "08:00",
		color: "red",
		weekday: Weekday.MONDAY
	}
	if(props.item){
		usedEvent = props.item;
	}

	const isDebug = useIsDebug();

	const [usedCourseTimetable, setCourseTimetable, addNewCourseTimetableEvent, removeCourseTimetableEvent] = useCourseTimetableEvents();

	const color = usedEvent?.color || "red";

	const translationEvent = useTranslation(TranslationKeys.event);
	const translationDelete = useTranslation(TranslationKeys.delete);
	const translationLocation = useTranslation(TranslationKeys.location);
	const translationTitle = useTranslation(TranslationKeys.title);
	const translationWeekday = useTranslation(TranslationKeys.weekday);
	const translationStart = useTranslation(TranslationKeys.startTime);
	const translationEnd = useTranslation(TranslationKeys.endTime);
	const translationColor = useTranslation(TranslationKeys.color);

	const translationSave = useTranslation(TranslationKeys.save);
	const translationCancel = useTranslation(TranslationKeys.cancel);

	async function handleDelete(){
		const itemToDelete = props.item;
		// delete the event from the timetableEvents with the id
		if(itemToDelete){
			await removeCourseTimetableEvent(itemToDelete.id);
		}
	}

	async function changeFieldValue(field, value){
		// update the event with the new value
		usedEvent[field] = value;
	}

	function renderTextEditRow(field, description, icon){
		let initialValue = event?.[field];

		return null
	}

	function renderWeekdayEditRow(field, description){
		const value = usedEvent.weekday;

		return(
			<SettingsRowSelectDayOfWeek selectedValue={value} onSelect={async (option: AvailableOption, hide: () => void) => {
				usedEvent.weekday = option.value as Weekday
				if(props.handleEdit){
					props.handleEdit(usedEvent, hide);
				}
			}} />
		)
	}

	function renderTimeEditRow(field, description, icon){
		let initialValue = usedEvent?.[field];

		return null
	}

	function renderColorEditRow(field, description, icon){
		let initialColor = usedEvent?.[field];

		return null
	}

	async function saveNewEvent(){
		let success = await addNewCourseTimetableEvent(usedEvent);
		if(success){

		}
	}

	const newEvent = !!usedEvent.id && usedEvent.id.length > 0;

	let content = [];
	if(!newEvent){
		content.push(<SettingsRow labelLeft={"ID"} leftIcon={"id"} rightContent={usedEvent.id}  accessibilityLabel={"ID"}/>)
	}


	content.push(renderTextEditRow("title", translationTitle, "name"));
	content.push(renderTextEditRow("location", translationLocation, "name"));
	content.push(renderColorEditRow("color", translationColor, "color"));
	content.push(renderTimeEditRow("start", translationStart, "time"));
	content.push(renderTimeEditRow("end", translationEnd, "time"));
	content.push(renderWeekdayEditRow("weekday", translationWeekday));
	content.push(<View style={{height: 20}}></View>)

	let requiredFieldsFilled = false;

	if(!newEvent){
		content.push(<SettingsRow labelLeft={translationDelete} leftIcon={"trash"} onPress={handleDelete}  accessibilityLabel={"DELETE"}/>)
	} else {
		const disabled = !requiredFieldsFilled
		const createRow = <SettingsRow disabled={disabled} labelLeft={translationEvent+": "+translationSave} leftIcon={"save"} onPress={saveNewEvent}  accessibilityLabel={"Save"}/>
		content.push(createRow);
	}

	if(isDebug){
		content.push(
			<View>
				<Text>{
					JSON.stringify(usedEvent, null, 2)
				}</Text>
			</View>
		)
	}


	return (
		<View style={{width: "100%", alignItems: "center"}}>
			<View style={{width: "100%"}}>
				{content}
			</View>
		</View>
	)

}
