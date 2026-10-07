import { STUDIP_DEBUG_CORS_PROXY, checkCorsProxy, STUDIP_INSTANCES, StudipImportError, buildBasicAuthorization, fetchStudipSchedule, mapStudipSchedule, studipWeekdayToWeekday } from './StudipImporter';

const instance = STUDIP_INSTANCES[0]!;

const scheduleResponse = {
	data: [
		{
			type: 'seminar-cycle-dates',
			id: 'c1',
			attributes: { title: '1.234 Analysis I', description: 'Vorlesung', start: '10:15', end: '11:45', weekday: 3, locations: ['69/E15'] },
			relationships: { owner: { data: { type: 'courses', id: 'course-a' } } },
		},
		{
			type: 'seminar-cycle-dates',
			id: 'c2',
			attributes: { title: '1.234 Analysis I', description: null, start: '12:15', end: '13:45', weekday: 4, locations: [] },
			relationships: { owner: { data: { type: 'courses', id: 'course-a' } } },
		},
		{
			type: 'seminar-cycle-dates',
			id: 'c3',
			attributes: { title: 'Sonntagskurs', start: '09:00', end: '10:00', weekday: 0, locations: ['A', 'B'] },
			relationships: { owner: { data: { type: 'courses', id: 'course-b' } } },
		},
		{ type: 'schedule-entries', id: 's1', attributes: { title: 'Sport', start: '17:00', end: '18:30', weekday: 7, color: '' } },
		{ type: 'schedule-entries', id: 'broken', attributes: { title: 'Kaputt', start: '18:00', end: '17:00', weekday: 2 } },
		{ type: 'courses', id: 'x', attributes: {} },
	],
};

describe('StudipImporter', () => {
	it('maps both Stud.IP weekday conventions', () => {
		expect(studipWeekdayToWeekday(1)).toBe('monday');
		expect(studipWeekdayToWeekday(6)).toBe('saturday');
		expect(studipWeekdayToWeekday(0)).toBe('sunday');
		expect(studipWeekdayToWeekday(7)).toBe('sunday');
		expect(studipWeekdayToWeekday(8)).toBeNull();
	});

	it('maps cycle dates and own entries, dropping broken ones', () => {
		const events = mapStudipSchedule(scheduleResponse);
		expect(events.map(e => e.id)).toEqual(['studip-seminar-cycle-dates-c1', 'studip-seminar-cycle-dates-c2', 'studip-seminar-cycle-dates-c3', 'studip-schedule-entries-s1']);
		expect(events[0]).toMatchObject({ title: '1.234 Analysis I', kind: 'Vorlesung', location: '69/E15', weekday: 'wednesday', start: '10:15', end: '11:45', source: 'import' });
		expect(events[1]?.location).toBeNull();
		expect(events[2]).toMatchObject({ weekday: 'sunday', location: 'A, B' });
		expect(events[3]).toMatchObject({ weekday: 'sunday', title: 'Sport' });
	});

	it('gives all dates of one course the same color', () => {
		const [a, b, c] = mapStudipSchedule(scheduleResponse);
		expect(a?.color).toBe(b?.color);
		expect(a?.color).not.toBe(c?.color);
	});

	it('rejects a response without data', () => {
		expect(() => mapStudipSchedule({})).toThrow(StudipImportError);
	});

	it('encodes credentials as UTF-8 basic auth', () => {
		expect(buildBasicAuthorization('max', 'pässwort')).toBe(`Basic ${Buffer.from('max:pässwort', 'utf8').toString('base64')}`);
	});

	it('loads the user id first, then the schedule', async () => {
		const calls: string[] = [];
		const fetchFn = async (url: string, init: { headers: Record<string, string> }) => {
			calls.push(url);
			expect(init.headers.Authorization).toMatch(/^Basic /);
			const body = url.endsWith('/users/me') ? { data: { id: 'u 1' } } : scheduleResponse;
			return { status: 200, json: async () => body };
		};
		const events = await fetchStudipSchedule(instance, ' max ', 'secret', fetchFn);
		expect(calls).toEqual(['https://studip.uni-osnabrueck.de/jsonapi.php/v1/users/me', 'https://studip.uni-osnabrueck.de/jsonapi.php/v1/users/u%201/schedule']);
		expect(events).toHaveLength(4);
	});

	it('routes both requests through the debug CORS proxy when given', async () => {
		const calls: string[] = [];
		const fetchFn = async (url: string) => {
			calls.push(url);
			return { status: 200, json: async () => (url.endsWith('/users/me') ? { data: { id: 'u1' } } : { data: [] }) };
		};
		await fetchStudipSchedule(instance, 'max', 'secret', fetchFn, { corsProxy: STUDIP_DEBUG_CORS_PROXY });
		expect(calls).toEqual(['https://cors-anywhere.herokuapp.com/https://studip.uni-osnabrueck.de/jsonapi.php/v1/users/me', 'https://cors-anywhere.herokuapp.com/https://studip.uni-osnabrueck.de/jsonapi.php/v1/users/u1/schedule']);
	});

	it('checks whether the debug CORS proxy is unlocked', async () => {
		const headers = (location: string | null) => ({ get: (name: string) => (name === 'location' ? location : null) });
		let requested = '';
		const ok = await checkCorsProxy(instance, STUDIP_DEBUG_CORS_PROXY, async url => {
			requested = url;
			return { status: 401, headers: headers(null), text: async () => '' };
		});
		expect(ok).toBe('ok');
		expect(requested).toBe('https://cors-anywhere.herokuapp.com/https://studip.uni-osnabrueck.de/jsonapi.php/v1/users/me');
		expect(await checkCorsProxy(instance, STUDIP_DEBUG_CORS_PROXY, async () => ({ status: 403, headers: headers('/corsdemo'), text: async () => 'See /corsdemo for more info' }))).toBe('locked');
		expect(await checkCorsProxy(instance, STUDIP_DEBUG_CORS_PROXY, async () => ({ status: 403, headers: headers(null), text: async () => 'Forbidden' }))).toBe('ok');
		expect(
			await checkCorsProxy(instance, STUDIP_DEBUG_CORS_PROXY, async () => {
				throw new TypeError('Failed to fetch');
			})
		).toBe('unreachable');
	});

	it('reports wrong credentials and network failures', async () => {
		await expect(fetchStudipSchedule(instance, 'max', 'wrong', async () => ({ status: 401, json: async () => ({}) }))).rejects.toMatchObject({ code: 'unauthorized' });
		await expect(
			fetchStudipSchedule(instance, 'max', 'x', async () => {
				throw new TypeError('Failed to fetch');
			})
		).rejects.toMatchObject({ code: 'network' });
		await expect(fetchStudipSchedule(instance, 'max', 'x', async () => ({ status: 500, json: async () => ({}) }))).rejects.toMatchObject({ code: 'unexpected' });
	});
});
