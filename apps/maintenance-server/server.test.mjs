// Run with: node --test apps/maintenance-server/server.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { buildAppSettingsResponse, createMaintenanceServer, normalizePath, resolveMaintenanceWindow } from './server.mjs';

const now = new Date('2026-10-10T17:33:20.000Z');
const outageStart = new Date('2026-10-10T17:31:00.000Z');

test('keeps an announced window that is active', () => {
	const window = resolveMaintenanceWindow('2026-10-10T17:30:00.000Z', '2026-10-10T17:40:00.000Z', outageStart, now);
	assert.deepEqual(window, { maintenance_start: '2026-10-10T17:30:00.000Z', maintenance_end: '2026-10-10T17:40:00.000Z' });
});

test('starts at the outage and extends the end without an announcement', () => {
	const window = resolveMaintenanceWindow(null, null, outageStart, now);
	assert.deepEqual(window, { maintenance_start: '2026-10-10T17:31:00.000Z', maintenance_end: '2026-10-10T17:45:00.000Z' });
});

test('extends a restart that takes longer than announced', () => {
	const window = resolveMaintenanceWindow('2026-10-10T17:00:00.000Z', '2026-10-10T17:10:00.000Z', outageStart, now);
	assert.deepEqual(window, { maintenance_start: '2026-10-10T17:31:00.000Z', maintenance_end: '2026-10-10T17:45:00.000Z' });
});

test('starts now when Directus goes down before the announced start', () => {
	const window = resolveMaintenanceWindow('2026-10-10T18:00:00.000Z', '2026-10-10T18:10:00.000Z', outageStart, now);
	assert.equal(window.maintenance_start, '2026-10-10T17:31:00.000Z');
});

test('answers nothing without a polled copy, so the app keeps its cached settings', () => {
	assert.equal(buildAppSettingsResponse(null, outageStart, now), null);
});

test('keeps all other app settings', () => {
	const body = buildAppSettingsResponse({ id: 1, housing_enabled: true, maintenance_start: null, maintenance_end: null }, outageStart, now);
	assert.equal(body.data.housing_enabled, true);
	assert.equal(body.data.maintenance_start, '2026-10-10T17:31:00.000Z');
});

test('normalizes paths', () => {
	assert.equal(normalizePath('/items/app_settings/?fields=a'), '/items/app_settings');
	assert.equal(normalizePath('/'), '/');
});

function listen(server) {
	return new Promise(resolve => server.listen(0, () => resolve(server.address().port)));
}

test('serves the polled copy and 503 for everything else', async () => {
	const directus = http.createServer((request, response) => {
		response.writeHead(200, { 'Content-Type': 'application/json' });
		response.end(JSON.stringify({ data: { id: 1, housing_enabled: true, maintenance_start: null, maintenance_end: null } }));
	});
	const directusPort = await listen(directus);
	const maintenance = createMaintenanceServer({ directusUrl: `http://localhost:${directusPort}`, pollIntervalSeconds: 3600, log: () => {} });
	await maintenance.poll();
	directus.close();
	const port = await listen(maintenance.server);
	try {
		const settings = await fetch(`http://localhost:${port}/items/app_settings?fields=maintenance_start`, { headers: { Origin: 'https://app.example' } });
		assert.equal(settings.status, 200);
		assert.equal(settings.headers.get('access-control-allow-origin'), 'https://app.example');
		const body = await settings.json();
		assert.equal(body.data.housing_enabled, true);
		assert.ok(body.data.maintenance_start);
		assert.ok(body.data.maintenance_end);

		const foods = await fetch(`http://localhost:${port}/items/foods`);
		assert.equal(foods.status, 503);
		assert.equal((await foods.json()).errors[0].extensions.code, 'SERVICE_UNAVAILABLE');
	} finally {
		maintenance.stop();
	}
});
