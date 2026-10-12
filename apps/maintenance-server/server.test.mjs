// Run with: node --test apps/maintenance-server/server.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { buildAppSettingsResponse, createMaintenanceServer, normalizePath, prepareMaintenanceWindow, resolveMaintenanceWindow } from './server.mjs';

const now = new Date('2026-10-10T17:33:20.000Z');
const outageStart = new Date('2026-10-10T17:31:00.000Z');
const prepared = { maintenance_start: '2026-10-10T17:30:00.000Z', maintenance_end: '2026-10-10T17:40:00.000Z' };

test('keeps a window from Directus that is running', () => {
	const window = resolveMaintenanceWindow('2026-10-10T17:20:00.000Z', '2026-10-10T17:50:00.000Z', prepared, outageStart, now);
	assert.deepEqual(window, { maintenance_start: '2026-10-10T17:20:00.000Z', maintenance_end: '2026-10-10T17:50:00.000Z' });
});

test('uses the prepared window without a running window from Directus', () => {
	assert.deepEqual(resolveMaintenanceWindow(null, null, prepared, outageStart, now), prepared);
	assert.deepEqual(resolveMaintenanceWindow('2026-10-10T18:00:00.000Z', '2026-10-10T18:10:00.000Z', prepared, outageStart, now), prepared);
});

test('extends the prepared window when the restart takes longer', () => {
	const late = new Date('2026-10-10T17:41:00.000Z');
	assert.deepEqual(resolveMaintenanceWindow(null, null, prepared, outageStart, late), { maintenance_start: '2026-10-10T17:30:00.000Z', maintenance_end: '2026-10-10T17:55:00.000Z' });
});

test('starts at the outage and extends the end without any preparation', () => {
	assert.deepEqual(resolveMaintenanceWindow(null, null, null, outageStart, now), { maintenance_start: '2026-10-10T17:31:00.000Z', maintenance_end: '2026-10-10T17:45:00.000Z' });
});

test('prepares from now until the estimated end, or keeps a running window from Directus', () => {
	assert.deepEqual(prepareMaintenanceWindow({ maintenance_start: null, maintenance_end: null }, '2026-10-10T17:50:00Z', now), { maintenance_start: '2026-10-10T17:33:20.000Z', maintenance_end: '2026-10-10T17:50:00.000Z' });
	assert.deepEqual(prepareMaintenanceWindow(null, null, now), { maintenance_start: '2026-10-10T17:33:20.000Z', maintenance_end: '2026-10-10T17:45:00.000Z' });
	const running = { maintenance_start: '2026-10-10T17:20:00.000Z', maintenance_end: '2026-10-10T18:00:00.000Z' };
	assert.deepEqual(prepareMaintenanceWindow(running, '2026-10-10T17:50:00Z', now), running);
});

test('answers nothing without a polled copy, so the app keeps its cached settings', () => {
	assert.equal(buildAppSettingsResponse(null, prepared, outageStart, now), null);
});

test('keeps all other app settings', () => {
	const body = buildAppSettingsResponse({ id: 1, housing_enabled: true, maintenance_start: null, maintenance_end: null }, null, outageStart, now);
	assert.equal(body.data.housing_enabled, true);
	assert.equal(body.data.maintenance_start, '2026-10-10T17:31:00.000Z');
});

test('normalizes paths', () => {
	assert.equal(normalizePath('/items/app_settings/?fields=a'), '/items/app_settings');
	assert.equal(normalizePath('/'), '/');
});

function listen(server, host) {
	return new Promise(resolve => server.listen(0, host, () => resolve(server.address().port)));
}

const LOGO = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

test('serves app_settings, server info and the logo from the copy, 503 for everything else', async () => {
	const directus = http.createServer((request, response) => {
		if (request.url.startsWith('/assets/logo-id')) {
			response.writeHead(200, { 'Content-Type': 'image/png' });
			response.end(LOGO);
			return;
		}
		response.writeHead(200, { 'Content-Type': 'application/json' });
		if (request.url.startsWith('/server/info')) {
			response.end(JSON.stringify({ data: { project: { project_name: 'Rocket Meals', project_color: '#2E7D32', project_logo: 'logo-id' } } }));
			return;
		}
		response.end(JSON.stringify({ data: { id: 1, housing_enabled: true, maintenance_start: null, maintenance_end: null } }));
	});
	const directusPort = await listen(directus);
	const maintenance = createMaintenanceServer({ directusUrl: `http://localhost:${directusPort}`, pollIntervalSeconds: 3600, log: () => {} });
	const window = await maintenance.prepare(new Date(Date.now() + 15 * 60 * 1000).toISOString());
	directus.close();
	const port = await listen(maintenance.server);
	try {
		const settings = await fetch(`http://localhost:${port}/items/app_settings?fields=maintenance_start`, { headers: { Origin: 'https://app.example' } });
		assert.equal(settings.status, 200);
		assert.equal(settings.headers.get('access-control-allow-origin'), 'https://app.example');
		const body = await settings.json();
		assert.equal(body.data.housing_enabled, true);
		assert.equal(body.data.maintenance_start, window.maintenance_start);
		assert.equal(body.data.maintenance_end, window.maintenance_end);

		const info = await fetch(`http://localhost:${port}/server/info`);
		assert.equal((await info.json()).data.project.project_color, '#2E7D32');

		const logo = await fetch(`http://localhost:${port}/assets/logo-id?fit=cover&width=512`);
		assert.equal(logo.headers.get('content-type'), 'image/png');
		assert.deepEqual(Buffer.from(await logo.arrayBuffer()), LOGO);

		const foods = await fetch(`http://localhost:${port}/items/foods`);
		assert.equal(foods.status, 503);
		assert.equal((await foods.json()).errors[0].extensions.code, 'SERVICE_UNAVAILABLE');
		assert.equal((await fetch(`http://localhost:${port}/server/health`)).status, 503);
	} finally {
		maintenance.stop();
	}
});

test('the control port prepares the window', async () => {
	const maintenance = createMaintenanceServer({ directusUrl: 'http://127.0.0.1:9', pollIntervalSeconds: 3600, log: () => {} });
	const port = await listen(maintenance.controlServer, '127.0.0.1');
	try {
		const end = new Date(Date.now() + 20 * 60 * 1000).toISOString();
		const response = await fetch(`http://127.0.0.1:${port}/prepare`, { method: 'POST', body: JSON.stringify({ maintenance_end: end }) });
		assert.equal(response.status, 200);
		assert.equal((await response.json()).maintenance_end, end);
		assert.equal((await fetch(`http://127.0.0.1:${port}/other`)).status, 404);
	} finally {
		maintenance.stop();
	}
});
