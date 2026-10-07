import { CourseTimetableEvent } from './CourseTimetableModel';

/**
 * Example week from the timetable design draft. Only reachable from the options menu in
 * debug mode, to try the screen before a real import (Stud.IP) exists. The texts are sample
 * data, not UI copy.
 */
export const COURSE_TIMETABLE_DEMO_EVENTS: Omit<CourseTimetableEvent, 'id'>[] = [
	{ weekday: 'monday', start: '08:15', end: '09:45', title: 'Lineare Algebra I', kind: 'Vorlesung', location: '69/E15', color: '#3A78D8', source: 'import' },
	{ weekday: 'monday', start: '10:15', end: '11:45', title: 'Informatik A', kind: 'Vorlesung', location: '32/102', color: '#E07A2A', source: 'import' },
	{ weekday: 'monday', start: '14:15', end: '15:45', title: 'Lineare Algebra I', kind: 'Tutorium', location: '66/E33', color: '#3A78D8', source: 'import' },
	{ weekday: 'tuesday', start: '10:15', end: '11:45', title: 'Datenbanksysteme', kind: 'Vorlesung', location: '93/E31', color: '#3D9A5C', source: 'import' },
	{ weekday: 'tuesday', start: '12:15', end: '13:45', title: 'Englisch B2', kind: 'Sprachkurs', location: '15/130', color: '#7E57D9', source: 'manual' },
	{ weekday: 'tuesday', start: '16:15', end: '17:45', title: 'Informatik A', kind: 'Übung', location: '31/449a', color: '#E07A2A', source: 'import' },
	{ weekday: 'wednesday', start: '08:15', end: '09:45', title: 'Lineare Algebra I', kind: 'Vorlesung', location: '69/E15', color: '#3A78D8', source: 'import' },
	{ weekday: 'wednesday', start: '10:15', end: '11:45', title: 'Analysis I', kind: 'Vorlesung', location: '69/E15', color: '#2A9C95', source: 'import' },
	{ weekday: 'wednesday', start: '14:15', end: '15:45', title: 'Datenbanksysteme', kind: 'Übung', location: '93/E06', color: '#3D9A5C', source: 'import' },
	{ weekday: 'wednesday', start: '15:00', end: '16:30', title: 'Lerngruppe Analysis', kind: null, location: 'Bibliothek', color: '#A88B4A', source: 'manual' },
	{ weekday: 'thursday', start: '10:15', end: '11:45', title: 'Analysis I', kind: 'Vorlesung', location: '69/E15', color: '#2A9C95', source: 'import' },
	{ weekday: 'thursday', start: '12:15', end: '13:45', title: 'Analysis I', kind: 'Übung', location: '69/E23', color: '#2A9C95', source: 'import' },
	{ weekday: 'thursday', start: '16:30', end: '18:00', title: 'Hochschulsport Volleyball', kind: null, location: 'Sporthalle', color: '#D9497F', source: 'manual' },
	{ weekday: 'friday', start: '08:15', end: '09:45', title: 'Informatik A', kind: 'Vorlesung', location: '32/102', color: '#E07A2A', source: 'import' },
	{ weekday: 'friday', start: '10:15', end: '11:45', title: 'Datenbanksysteme', kind: 'Vorlesung', location: '93/E31', color: '#3D9A5C', source: 'import' },
];

export function createCourseTimetableDemoEvents(): CourseTimetableEvent[] {
	return COURSE_TIMETABLE_DEMO_EVENTS.map((event, index) => ({ ...event, id: `demo-${index + 1}` }));
}
