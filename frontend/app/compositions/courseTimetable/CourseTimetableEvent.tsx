import {
	BaseCourseTimetableEvent,
	CourseTimetableEventType, getNewCourseTimetableEvent, isCourseTimetableEventType
} from '@/compositions/courseTimetable/CourseTimetableHelper';
import {FunctionComponent} from 'react';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {Text, View} from '@/components/Themed';
import {Weekday} from '@/helper/date/DateHelper';
import {AvailableOption, SettingsRowSelectDayOfWeek} from '@/compositions/settings/SettingsRowSelectDayOfWeek';
import {SettingsRow} from '@/components/settings/SettingsRow';
import {useIsDebug} from '@/states/Debug';
import {IconNames} from '@/constants/IconNames';
import {SettingsRowTextEdit} from '@/components/settings/SettingsRowTextEdit';
import {SettingsRowSpacer} from '@/components/settings/SettingsRowSpacer';
import {MyButton} from '@/components/buttons/MyButton';
import {SettingsRowTimeEdit} from '@/components/settings/SettingsRowTimeEdit';
import {SettingsRowColorEdit} from '@/components/settings/SettingsRowColorEdit';

interface AppState {
	item?: BaseCourseTimetableEvent | CourseTimetableEventType
	handleDelete?: (itemToDelete: CourseTimetableEventType) => void
	handleEditExisting?: (usedEvent: CourseTimetableEventType, hide: () => void) => void
	handleEditTemplate?: (usedEvent: BaseCourseTimetableEvent, hide: () => void) => void
	handleCreateNew?: (usedEvent: BaseCourseTimetableEvent) => void
}

export const CourseTimetableEvent: FunctionComponent<AppState> = (props) => {
	const translation_new = useTranslation(TranslationKeys.new);

	let usedEvent = getNewCourseTimetableEvent(translation_new);
	if (props.item) {
		usedEvent = props.item;
	}

	const isDebug = useIsDebug();

	const color = usedEvent?.color || 'red';

	const translationEvent = useTranslation(TranslationKeys.event);
	const translationDelete = useTranslation(TranslationKeys.delete);
	const translationLocation = useTranslation(TranslationKeys.location);
	const translationTitle = useTranslation(TranslationKeys.title);
	const translationWeekday = useTranslation(TranslationKeys.weekday);
	const translationStart = useTranslation(TranslationKeys.startTime);
	const translationEnd = useTranslation(TranslationKeys.endTime);
	const translationColor = useTranslation(TranslationKeys.color);
	const translationSave = useTranslation(TranslationKeys.save);

	async function handleDelete() {
		const itemToDelete = props.item
		// delete the event from the timetableEvents with the id
		// check if itemToDelete is type of CourseTimetableEventType
		if (!!itemToDelete && props.handleDelete && isCourseTimetableEventType(itemToDelete)) {
			props.handleDelete(itemToDelete);
		}
	}

	async function handleEdit(item: BaseCourseTimetableEvent | CourseTimetableEventType, hide: () => void) {
		if (isCourseTimetableEventType(item)) {
			if (props.handleEditExisting) {
				props.handleEditExisting(item, hide);
			}
		} else {
			if (props.handleEditTemplate) {
				props.handleEditTemplate(item, hide);
			}
		}
	}

	function renderTextEditRow(field: string, description: string) {
		const value = usedEvent?.[field];

		return (
			<SettingsRowTextEdit leftIcon={IconNames.attribute_text_icon}
				accessibilityLabel={
					translationEvent+': '+description
				}
				value={value}
				labelLeft={description}
				onSave={(newValue, hide) => {
					usedEvent[field] = newValue;
					handleEdit(usedEvent, hide);
				}}
			/>
		)
	}

	function renderWeekdayEditRow() {
		const value = usedEvent.weekday;

		return (
			<SettingsRowSelectDayOfWeek selectedValue={value}
				onSelect={async (option: AvailableOption, hide: () => void) => {
					usedEvent.weekday = option.value as Weekday
					handleEdit(usedEvent, hide);
				}}
			/>
		)
	}

	function renderTimeEditRow(field: string, description: string, icon: string) {
		const value = usedEvent?.[field];

		return (
			<SettingsRowTimeEdit leftIcon={icon}
				accessibilityLabel={translationEvent+': '+description}
				value={value}
				labelLeft={description}
				onSave={(newValue, hide) => {
					usedEvent[field] = newValue;
					handleEdit(usedEvent, hide);
				}}
			/>
		)
	}

	function renderColorEditRow(field, description, icon) {
		const initialColor = usedEvent?.[field];

		return (
			<SettingsRowColorEdit allowCustomColor={false}
				leftIcon={icon}
				accessibilityLabel={translationEvent+': '+description}
				value={initialColor}
				labelLeft={description}
				onSave={(newValue, hide) => {
					usedEvent[field] = newValue;
					handleEdit(usedEvent, hide);
				}}
			/>
		)
	}

	async function saveNewEvent() {
		if (props.handleCreateNew) {
			props.handleCreateNew(usedEvent);
		}
	}

	const newEvent = !usedEvent.id

	const content = [];
	if (!newEvent) {
		content.push(<SettingsRow labelLeft={'ID'} leftIcon={IconNames.identifier} labelRight={usedEvent.id} accessibilityLabel={'ID'}/>)
	}


	content.push(renderTextEditRow('title', translationTitle));
	content.push(renderTextEditRow('location', translationLocation));
	content.push(renderColorEditRow('color', translationColor, IconNames.color_edit_icon));
	content.push(renderTimeEditRow('start', translationStart, IconNames.time_start_icon));
	content.push(renderTimeEditRow('end', translationEnd, IconNames.time_end_icon));
	content.push(renderWeekdayEditRow());
	content.push(<SettingsRowSpacer/>)

	if (!newEvent) {
		const label = translationDelete;
		const accessibilityLabel = translationEvent+': '+translationDelete;
		content.push(<MyButton leftIconColoredBox={true} accessibilityLabel={accessibilityLabel} onPress={handleDelete} leftIcon={IconNames.delete_icon} text={label}/>)
	} else {
		const label = translationSave;
		const accessibilityLabel = translationEvent+': '+translationSave;
		const createRow = <MyButton leftIconColoredBox={true} accessibilityLabel={accessibilityLabel} onPress={saveNewEvent} leftIcon={IconNames.save_icon} text={label}/>
		content.push(createRow);
	}

	if (isDebug) {
		content.push(
			<View>
				<Text>{
					JSON.stringify(usedEvent, null, 2)
				}
				</Text>
			</View>
		)
	}


	return (
		<View style={{width: '100%', alignItems: 'center'}}>
			<View style={{width: '100%'}}>
				{content}
			</View>
		</View>
	)
}
