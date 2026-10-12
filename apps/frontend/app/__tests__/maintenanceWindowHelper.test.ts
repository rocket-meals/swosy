import { getMaintenanceNotice, getMillisecondsUntilNextMaintenanceChange, isMaintenanceRunning } from '@/helper/maintenanceWindowHelper';

const START = '2026-10-10T17:30:00Z';
const END = '2026-10-10T17:40:00.000Z';
const at = (time: string) => new Date(`2026-10-10T${time}Z`);
const MINUTE = 60 * 1000;

describe('getMaintenanceNotice', () => {
	it('shows nothing without a start', () => {
		expect(getMaintenanceNotice(null, END, at('17:35:00'))).toBeNull();
		expect(getMaintenanceNotice('not a date', END, at('17:35:00'))).toBeNull();
	});

	it('shows nothing earlier than 30 minutes before the start', () => {
		expect(getMaintenanceNotice(START, END, at('16:59:59'))).toBeNull();
	});

	it('announces the maintenance in the 30 minutes before the start', () => {
		expect(getMaintenanceNotice(START, END, at('17:00:00'))?.phase).toBe('upcoming');
		expect(getMaintenanceNotice(START, END, at('17:29:59'))?.phase).toBe('upcoming');
	});

	it('reports the running maintenance until its end', () => {
		const notice = getMaintenanceNotice(START, END, at('17:30:00'));
		expect(notice?.phase).toBe('active');
		expect(notice?.end).toEqual(new Date(END));
		expect(getMaintenanceNotice(START, END, at('17:40:00'))).toBeNull();
	});

	it('assumes one hour when the end is missing or not after the start', () => {
		expect(getMaintenanceNotice(START, null, at('18:29:59'))?.phase).toBe('active');
		expect(getMaintenanceNotice(START, null, at('18:30:00'))).toBeNull();
		expect(getMaintenanceNotice(START, '2026-10-10T17:00:00Z', at('18:29:59'))?.phase).toBe('active');
	});
});

describe('getMillisecondsUntilNextMaintenanceChange', () => {
	it('points to the next phase change', () => {
		expect(getMillisecondsUntilNextMaintenanceChange(START, END, at('16:00:00'))).toBe(60 * MINUTE);
		expect(getMillisecondsUntilNextMaintenanceChange(START, END, at('17:10:00'))).toBe(20 * MINUTE);
		expect(getMillisecondsUntilNextMaintenanceChange(START, END, at('17:35:00'))).toBe(5 * MINUTE);
	});

	it('returns null once the maintenance is over or none is set', () => {
		expect(getMillisecondsUntilNextMaintenanceChange(START, END, at('17:40:00'))).toBeNull();
		expect(getMillisecondsUntilNextMaintenanceChange(null, null, at('17:40:00'))).toBeNull();
	});
});

describe('isMaintenanceRunning', () => {
	it('is only true while the window runs', () => {
		expect(isMaintenanceRunning(START, END, at('17:20:00'))).toBe(false);
		expect(isMaintenanceRunning(START, END, at('17:30:00'))).toBe(true);
		expect(isMaintenanceRunning(START, END, at('17:39:59'))).toBe(true);
		expect(isMaintenanceRunning(START, END, at('17:40:00'))).toBe(false);
		expect(isMaintenanceRunning(null, null, at('17:35:00'))).toBe(false);
	});
});
