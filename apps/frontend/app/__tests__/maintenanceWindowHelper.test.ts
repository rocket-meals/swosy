import { getMaintenanceNotice, getMillisecondsUntilNextMaintenanceChange } from '@/helper/maintenanceWindowHelper';

const START = '2026-10-10T19:30:00';
const END = '2026-10-10T19:40:00';
const at = (time: string) => new Date(`2026-10-10T${time}`);
const MINUTE = 60 * 1000;

describe('getMaintenanceNotice', () => {
	it('shows nothing without a start', () => {
		expect(getMaintenanceNotice(null, END, at('19:35:00'))).toBeNull();
		expect(getMaintenanceNotice('not a date', END, at('19:35:00'))).toBeNull();
	});

	it('shows nothing earlier than 30 minutes before the start', () => {
		expect(getMaintenanceNotice(START, END, at('18:59:59'))).toBeNull();
	});

	it('announces the maintenance in the 30 minutes before the start', () => {
		expect(getMaintenanceNotice(START, END, at('19:00:00'))?.phase).toBe('upcoming');
		expect(getMaintenanceNotice(START, END, at('19:29:59'))?.phase).toBe('upcoming');
	});

	it('reports the running maintenance until its end', () => {
		const notice = getMaintenanceNotice(START, END, at('19:30:00'));
		expect(notice?.phase).toBe('active');
		expect(notice?.end).toEqual(new Date(END));
		expect(getMaintenanceNotice(START, END, at('19:40:00'))).toBeNull();
	});

	it('assumes one hour when the end is missing or not after the start', () => {
		expect(getMaintenanceNotice(START, null, at('20:29:59'))?.phase).toBe('active');
		expect(getMaintenanceNotice(START, null, at('20:30:00'))).toBeNull();
		expect(getMaintenanceNotice(START, '2026-10-10T19:00:00', at('20:29:59'))?.phase).toBe('active');
	});
});

describe('getMillisecondsUntilNextMaintenanceChange', () => {
	it('points to the next phase change', () => {
		expect(getMillisecondsUntilNextMaintenanceChange(START, END, at('18:00:00'))).toBe(60 * MINUTE);
		expect(getMillisecondsUntilNextMaintenanceChange(START, END, at('19:10:00'))).toBe(20 * MINUTE);
		expect(getMillisecondsUntilNextMaintenanceChange(START, END, at('19:35:00'))).toBe(5 * MINUTE);
	});

	it('returns null once the maintenance is over or none is set', () => {
		expect(getMillisecondsUntilNextMaintenanceChange(START, END, at('19:40:00'))).toBeNull();
		expect(getMillisecondsUntilNextMaintenanceChange(null, null, at('19:40:00'))).toBeNull();
	});
});
