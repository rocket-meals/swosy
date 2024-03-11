import React, {FunctionComponent} from 'react';
import {CourseTimetableImportDefaultComponent} from '../CourseTimetableImportDefaultComponent';
import {Connector, UrlHelper} from 'studip-api';

interface AppState {
    onCloseModal: () => void;
    onImport: (events: TimetableEvent[]) => void;
}

export const TimetableImportStudIP: FunctionComponent<AppState> = (props) => {
	const [demo, setDemo] = useDemoMode()

	const onCloseModal = props?.onCloseModal;

	async function loadStudIPEvents(studIpDomain, username, password) {
		//console.log("studIpDomain", studIpDomain)
		try {
			const client = new Connector(studIpDomain, username, password);
			await client.loadUser();
			const user = client.getUser();
			//console.log("user", user);
			const schedule = await client.loadSchedule();
			//console.log("schedule");
			//console.log(schedule);
			return schedule;
		} catch (e) {
			//console.log("error");
			//console.log(e);
		}
		return null;
	}

	async function onLogin(username, password) {
		//console.log("username", username);
		//console.log("password", password)

		let events = null;
		let rawSchedule = null;
		if (demo) {
			rawSchedule = getDemoRawScheduleData();
		} else {
			rawSchedule = await loadStudIPEvents(UrlHelper.STUDIP_DOMAIN_UNI_OSNABRUECK, username, password)
		}
		if (rawSchedule) {
			events = parseStudIPDataToEvents(rawSchedule);
		}
		if (events) {
			if (props?.onImport) {
				props.onImport(events);
				return true;
			}
		}

		return !!events;
	}

	function parseStudIPDataToEvent(rawEvent: any): TimetableEvent {
		const rawWeekdayNumber = rawEvent?.weekday;
		const weekday = DateHelper.getWeekdayByDayNumber(rawWeekdayNumber);

		const event: TimetableEvent = {
			id: undefined,
			title: rawEvent.name,
			location: rawEvent.location,
			color: rawEvent.color,
			start: rawEvent.start,
			end: rawEvent.end,
			weekday: weekday
		}
		return event;
	}

	function parseStudIPDataToEvents(scheduleEvents: [any]): [TimetableEvent] {
		//console.log("parseStudIPDataToEvents");
		//console.log("scheduleEvents");
		//console.log(scheduleEvents);
		const parsedEvents: [TimetableEvent] = [];
		for (const scheduleEvent of scheduleEvents) {
			const event = parseStudIPDataToEvent(scheduleEvent);
			parsedEvents.push(event);
		}
		//console.log("parsedEvents")
		console.log(parsedEvents)
		return parsedEvents;
	}

	function getDemoRawScheduleData() {
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

	const initialPassword = demo ? '1234' : undefined;
	const initialEmail = demo ? 'demoUser' : undefined;

	return <CourseTimetableImportDefaultComponent onCloseModal={onCloseModal} onLogin={onLogin} initialEmail={initialEmail} initialPassword={initialPassword}  />
}
