import { createOutageDetectingFetch, isServerOutageResponse, onServerOutageSuspected } from '@/helper/serverOutageHelper';

const response = (status: number, contentType: string | null) => ({
	status,
	headers: { get: (name: string) => (name.toLowerCase() === 'content-type' ? contentType : null) },
});

describe('isServerOutageResponse', () => {
	it('treats gateway errors as an outage', () => {
		expect(isServerOutageResponse(502, 'text/plain')).toBe(true);
		expect(isServerOutageResponse(503, 'application/json; charset=utf-8')).toBe(true);
		expect(isServerOutageResponse(504, null)).toBe(true);
	});

	it("treats Traefik's plain-text 404 as an outage, but not Directus' JSON 404", () => {
		expect(isServerOutageResponse(404, 'text/plain; charset=utf-8')).toBe(true);
		expect(isServerOutageResponse(404, null)).toBe(true);
		expect(isServerOutageResponse(404, 'application/json; charset=utf-8')).toBe(false);
	});

	it('ignores normal answers', () => {
		expect(isServerOutageResponse(200, 'application/json')).toBe(false);
		expect(isServerOutageResponse(401, 'application/json')).toBe(false);
		expect(isServerOutageResponse(403, 'application/json')).toBe(false);
		expect(isServerOutageResponse(500, 'application/json')).toBe(false);
	});
});

describe('createOutageDetectingFetch', () => {
	let calls: number;
	let unsubscribe: () => void;

	beforeEach(() => {
		calls = 0;
		unsubscribe = onServerOutageSuspected(() => {
			calls++;
		});
	});

	afterEach(() => unsubscribe());

	it('passes the response through and reports an outage response', async () => {
		const outage = response(503, 'application/json');
		const fetch = createOutageDetectingFetch(async () => outage);
		await expect(fetch('https://example.org/items/foods')).resolves.toBe(outage);
		expect(calls).toBe(1);
	});

	it('does not report a normal response', async () => {
		const fetch = createOutageDetectingFetch(async () => response(200, 'application/json'));
		await fetch('https://example.org/items/foods');
		expect(calls).toBe(0);
	});

	it('reports a failed request and rethrows its error', async () => {
		const error = new TypeError('Network request failed');
		const fetch = createOutageDetectingFetch(async () => {
			throw error;
		});
		await expect(fetch('https://example.org/items/foods')).rejects.toBe(error);
		expect(calls).toBe(1);
	});

	it('does not report a request the app aborted itself', async () => {
		const abort = Object.assign(new Error('aborted'), { name: 'AbortError' });
		const fetch = createOutageDetectingFetch(async () => {
			throw abort;
		});
		await expect(fetch('https://example.org/items/foods')).rejects.toBe(abort);
		expect(calls).toBe(0);
	});

	it('stops reporting after unsubscribing', async () => {
		unsubscribe();
		const fetch = createOutageDetectingFetch(async () => response(502, 'text/plain'));
		await fetch('https://example.org/items/foods');
		expect(calls).toBe(0);
	});
});
