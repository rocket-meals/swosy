import { createEventId, findBuildingIdForLocation, layoutDayEvents, mergeImportedEvents, normalizeCourseTimetable, removeEvent, serializeCourseTimetable, weekdayOfDate, type CourseTimetableEvent } from './CourseTimetableModel';

const event = (overrides: Partial<CourseTimetableEvent>): CourseTimetableEvent => ({
	id: '1',
	title: 'Analysis I',
	color: '#2A9C95',
	start: '10:15',
	end: '11:45',
	weekday: 'wednesday',
	...overrides,
});

describe('CourseTimetableModel', () => {
	it('reads the legacy stored shape with a weekday object', () => {
		const events = normalizeCourseTimetable({
			'1': { id: '1', title: 'Analysis', color: '#ff0000', start: '8:15', end: '09:45', weekday: { id: 'monday', name: 'Mon' }, location: '69/E15' },
		});
		expect(events).toEqual([{ id: '1', title: 'Analysis', color: '#ff0000', start: '08:15', end: '09:45', weekday: 'monday', location: '69/E15', kind: null, source: 'manual', building_id: null }]);
	});

	it('drops entries with invalid times or weekdays', () => {
		expect(normalizeCourseTimetable({ a: { start: '10:00', end: '09:00', weekday: 'monday' }, b: { start: 'x', end: '09:00', weekday: 'monday' }, c: { start: '08:00', end: '09:00', weekday: 'funday' } })).toEqual([]);
		expect(normalizeCourseTimetable(null)).toEqual([]);
	});

	it('round-trips through the stored shape', () => {
		const events = [event({ id: 'a', source: 'import', kind: 'Vorlesung', location: '69/E15', building_id: null })];
		const stored = serializeCourseTimetable(events);
		expect(stored.a?.weekday).toEqual({ id: 'wednesday', name: 'Wed' });
		expect(normalizeCourseTimetable(stored)).toEqual(events);
	});

	it('keeps the import source data through the stored shape', () => {
		const sourceData = { type: 'seminar-cycle-dates', id: 'c1', attributes: { locations: { '2': '69/E15' } } };
		const events = [event({ id: 'a', source: 'import', kind: null, location: '69/E15', building_id: null, source_data: sourceData })];
		expect(normalizeCourseTimetable(serializeCourseTimetable(events))[0]?.source_data).toEqual(sourceData);
	});

	it('creates ids that do not collide', () => {
		const existing = [event({ id: 'a' }), event({ id: 'b' })];
		const id = createEventId(existing);
		expect(existing.map(e => e.id)).not.toContain(id);
		expect(removeEvent(existing, 'a').map(e => e.id)).toEqual(['b']);
	});

	it('keeps manual events when merging an import, unless overwriting', () => {
		const current = [event({ id: 'm', source: 'manual' }), event({ id: 'old', source: 'import' })];
		const imported = [event({ id: 'new' })];
		expect(
			mergeImportedEvents(current, imported, false)
				.map(e => e.id)
				.sort()
		).toEqual(['m', 'new']);
		expect(mergeImportedEvents(current, imported, true).map(e => e.id)).toEqual(['new']);
	});

	it('maps dates to weekdays', () => {
		expect(weekdayOfDate(new Date(2026, 9, 7))).toBe('wednesday');
		expect(weekdayOfDate(new Date(2026, 9, 11))).toBe('sunday');
	});

	it('puts overlapping events into separate lanes', () => {
		const laidOut = layoutDayEvents([event({ id: 'a', start: '14:15', end: '15:45' }), event({ id: 'b', start: '15:00', end: '16:30' }), event({ id: 'c', start: '17:00', end: '18:00' })]);
		const byId = Object.fromEntries(laidOut.map(e => [e.id, e]));
		expect(byId.a).toMatchObject({ lane: 0, laneCount: 2, overlaps: true });
		expect(byId.b).toMatchObject({ lane: 1, laneCount: 2, overlaps: true });
		expect(byId.c).toMatchObject({ lane: 0, laneCount: 1, overlaps: false });
	});

	it('finds the building of a room', () => {
		const buildings = [
			{ id: 'b69', alias: '69' },
			{ id: 'b6', alias: '6' },
			{ id: 'lib', alias: 'Bibliothek', external_identifier: 'UB' },
		];
		expect(findBuildingIdForLocation({ location: '69/E15' }, buildings)).toBe('b69');
		expect(findBuildingIdForLocation({ location: 'bibliothek' }, buildings)).toBe('lib');
		expect(findBuildingIdForLocation({ location: 'UB, Raum 3' }, buildings)).toBe('lib');
		expect(findBuildingIdForLocation({ location: '691/2' }, buildings)).toBeNull();
		expect(findBuildingIdForLocation({ location: 'x', building_id: 'b6' }, buildings)).toBe('b6');
	});
});
