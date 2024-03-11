import React, {FunctionComponent} from 'react';
import {CourseTimetableImportDefaultComponent} from '../CourseTimetableImportDefaultComponent';
import { CourseTimetableEventType} from '@/compositions/courseTimetable/CourseTimetableHelper';
import {DateHelper} from '@/helper/date/DateHelper';

interface AppState {
    onCloseModal: () => void;
    onImport: (events: CourseTimetableEventType[]) => void;
}

export const getDemoRawScheduleData = () => {
	return [
		{
			'name': 'Einführung in Algorithmen und Datenstrukturen (Brinkmeier, Hüwel, Ossovski)',
			'weekday': 0,
			'color': '#ffbd33',
			'building': '93',
			'room': 'E10',
			'location': 'Coding Class 1(93/E10), (Online-Meetingraum "Coding Class")',
			'start': '12:00',
			'end': '14:00'
		},
		{
			'name': 'Einführung in Algorithmen und Datenstrukturen (Brinkmeier, Hüwel, Ossovski)',
			'weekday': 0,
			'color': '#ffbd33',
			'building': '01',
			'room': 'E01',
			'location': 'Vorlesung01/E01',
			'start': '14:00',
			'end': '16:00'
		},
		{
			'name': 'Seminar Software Engineering (Pulvermüller, Huning, Ziegenhagen et al.)',
			'weekday': 1,
			'color': '#ffbd33',
			'building': '50',
			'room': 'E09',
			'location': '50/E09',
			'start': '14:00',
			'end': '16:00'
		},
		{
			'name': 'Einführung in Algorithmen und Datenstrukturen (Brinkmeier, Hüwel, Ossovski)',
			'weekday': 1,
			'color': '#ffbd33',
			'building': '93',
			'room': 'E10',
			'location': 'Coding Class 2(93/E10), (Online-Meetingraum "Coding Class")',
			'start': '12:00',
			'end': '14:00'
		},
		{
			'name': 'Einführung in Algorithmen und Datenstrukturen (Brinkmeier, Hüwel, Ossovski)',
			'weekday': 1,
			'color': '#ffbd33',
			'building': '01',
			'room': 'E01',
			'location': 'Vorlesung01/E01',
			'start': '14:00',
			'end': '16:00'
		},
		{
			'name': 'Software Engineering (Pulvermüller, Ziegenhagen, Huning et al.)',
			'weekday': 1,
			'color': '#ffbd33',
			'building': '66',
			'room': 'E33',
			'location': 'Vorlesung66/E33',
			'start': '16:00',
			'end': '18:00'
		},
		{
			'name': '',
			'weekday': 2,
			'color': '#682c8b',
			'building': '',
			'room': '',
			'location': 'AG SE Meeting',
			'start': '12:00',
			'end': '14:00'
		},
		{
			'name': 'Einführung in Algorithmen und Datenstrukturen (Brinkmeier, Hüwel, Ossovski)',
			'weekday': 2,
			'color': '#ffbd33',
			'building': '93',
			'room': 'E10',
			'location': 'Coding Class 3(93/E10), (Online-Meetingraum "Coding Class")',
			'start': '08:00',
			'end': '10:00'
		},
		{
			'name': 'Einführung in Algorithmen und Datenstrukturen (Brinkmeier, Hüwel, Ossovski)',
			'weekday': 2,
			'color': '#ffbd33',
			'building': '93',
			'room': 'E10',
			'location': 'Coding Class 4(93/E10), (Online-Meetingraum "Coding Class")',
			'start': '10:00',
			'end': '12:00'
		},
		{
			'name': 'Einführung in Algorithmen und Datenstrukturen (Brinkmeier, Hüwel, Ossovski)',
			'weekday': 2,
			'color': '#ffbd33',
			'building': '',
			'room': '',
			'location': 'Coding Class 5(Online-Meetingraum "Coding Class")',
			'start': '16:00',
			'end': '18:00'
		},
		{
			'name': 'Software Engineering (Pulvermüller, Ziegenhagen, Huning et al.)',
			'weekday': 2,
			'color': '#ffbd33',
			'building': '93',
			'room': 'E31',
			'location': 'Vorlesung93/E31',
			'start': '12:00',
			'end': '14:00'
		},
		{
			'name': 'Einführung in Algorithmen und Datenstrukturen (Brinkmeier, Hüwel, Ossovski)',
			'weekday': 3,
			'color': '#ffbd33',
			'building': '93',
			'room': 'E10',
			'location': 'Coding Class 6(93/E10), (Online-Meetingraum "Coding Class")',
			'start': '12:00',
			'end': '14:00'
		},
		{
			'name': 'Einführung in Algorithmen und Datenstrukturen (Brinkmeier, Hüwel, Ossovski)',
			'weekday': 3,
			'color': '#ffbd33',
			'building': '93',
			'room': 'E10',
			'location': 'Coding Class 7(93/E10), (Online-Meetingraum "Coding Class")',
			'start': '14:00',
			'end': '16:00'
		},
		{
			'name': 'Einführung in Algorithmen und Datenstrukturen (Brinkmeier, Hüwel, Ossovski)',
			'weekday': 3,
			'color': '#ffbd33',
			'building': '',
			'room': '',
			'location': 'Coding Class 8(Online-Meetingraum "Coding Class")',
			'start': '16:00',
			'end': '18:00'
		},
		{
			'name': 'Software Engineering (Pulvermüller, Ziegenhagen, Huning et al.)',
			'weekday': 4,
			'color': '#ffbd33',
			'building': '93',
			'room': 'E33',
			'location': 'Übung93/E33',
			'start': '10:00',
			'end': '12:00'
		},
		{
			'name': 'Software Engineering (Pulvermüller, Ziegenhagen, Huning et al.)',
			'weekday': 4,
			'color': '#ffbd33',
			'building': '93',
			'room': 'E06',
			'location': 'Übung93/E06',
			'start': '12:00',
			'end': '14:00'
		},
		{
			'name': '',
			'weekday': 5,
			'color': '#682c8b',
			'building': '',
			'room': '',
			'location': '0',
			'start': '08:00',
			'end': '08:59'
		},
		{
			'name': '',
			'weekday': 5,
			'color': '#b02e7c',
			'building': '',
			'room': '',
			'location': '1',
			'start': '09:00',
			'end': '10:00'
		},
		{
			'name': '',
			'weekday': 5,
			'color': '#d60000',
			'building': '',
			'room': '',
			'location': '2',
			'start': '10:00',
			'end': '11:00'
		},
		{
			'name': '',
			'weekday': 5,
			'color': '#f26e00',
			'building': '',
			'room': '',
			'location': '3',
			'start': '11:00',
			'end': '12:00'
		},
		{
			'name': '',
			'weekday': 5,
			'color': '#d60000',
			'building': '',
			'room': '',
			'location': '',
			'start': '13:00',
			'end': '14:00'
		}
	]
}

function parseStudIPDataToEvent(rawEvent: any, index: number): CourseTimetableEventType {
	const rawWeekdayNumber = rawEvent?.weekday;
	const weekday = DateHelper.getWeekdayByDayNumber(rawWeekdayNumber);

	const event: CourseTimetableEventType = {
		id: index+'',
		title: rawEvent.name,
		location: rawEvent.location,
		color: rawEvent.color,
		start: rawEvent.start,
		end: rawEvent.end,
		weekday: weekday
	}
	return event;
}

function parseStudIPDataToCourseTimetableEvents(scheduleEvents: [any]): CourseTimetableEventType[] {
	//console.log("parseStudIPDataToEvents");
	//console.log("scheduleEvents");
	//console.log(scheduleEvents);
	const parsedEvents: CourseTimetableEventType[] = []
	let index = 1;
	for (const scheduleEvent of scheduleEvents) {
		const event = parseStudIPDataToEvent(scheduleEvent, index);
		parsedEvents.push(event)
		index++;
	}
	//console.log("parsedEvents")
	console.log(parsedEvents)
	return parsedEvents;
}

export function getParsedDemoEvents() {
	const rawSchedule = getDemoRawScheduleData();
	if (rawSchedule) {
		return parseStudIPDataToCourseTimetableEvents(rawSchedule);
	}
	return null;
}

export const TimetableImportDemo: FunctionComponent<AppState> = (props) => {
	const onCloseModal = props.onCloseModal;

	async function onLogin(username, password) {
		const events = getParsedDemoEvents();
		if (events) {
			if (props?.onImport) {
				props.onImport(events);
				return true;
			}
		}

		return !!events;
	}

	const initialPassword = '1234';
	const initialEmail = 'demoUser'

	return <CourseTimetableImportDefaultComponent onCloseModal={onCloseModal} onLogin={onLogin} initialEmail={initialEmail} initialPassword={initialPassword}  />
}
