// Sets or clears app_settings.maintenance_start/_end through the Directus API.
//
// Runs inside the rocket-meals-directus container, piped in by
// scripts/update-and-generate-env.sh:
//   docker compose exec -T -e MAINTENANCE_ACTION=set ... rocket-meals-directus node --input-type=module - < scripts/maintenance-window.mjs
//
// The container already has PORT, ADMIN_EMAIL and ADMIN_PASSWORD in its
// environment, so no extra credentials are needed on the host.
//
// MAINTENANCE_ACTION=set    writes MAINTENANCE_START and MAINTENANCE_END
// MAINTENANCE_ACTION=clear  empties both fields, but only if maintenance_start
//                           still equals MAINTENANCE_START, so a maintenance
//                           window entered by hand in the meantime is kept

const { PORT, ADMIN_EMAIL, ADMIN_PASSWORD, MAINTENANCE_ACTION, MAINTENANCE_START, MAINTENANCE_END } = process.env;
const baseUrl = `http://localhost:${PORT}`;

async function request(path, options = {}) {
	const response = await fetch(`${baseUrl}${path}`, {
		...options,
		headers: { 'Content-Type': 'application/json', ...options.headers },
	});
	if (!response.ok) {
		throw new Error(`${options.method ?? 'GET'} ${path} failed with HTTP ${response.status}: ${await response.text()}`);
	}
	return response.status === 204 ? null : response.json();
}

async function main() {
	const login = await request('/auth/login', {
		method: 'POST',
		body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
	});
	const headers = { Authorization: `Bearer ${login.data.access_token}` };

	if (MAINTENANCE_ACTION === 'set') {
		await request('/items/app_settings', {
			method: 'PATCH',
			headers,
			body: JSON.stringify({ maintenance_start: MAINTENANCE_START, maintenance_end: MAINTENANCE_END }),
		});
		console.log(`Maintenance window set: ${MAINTENANCE_START} - ${MAINTENANCE_END}`);
		return;
	}

	if (MAINTENANCE_ACTION === 'clear') {
		const current = await request('/items/app_settings?fields=maintenance_start', { headers });
		const currentStart = current.data?.maintenance_start ?? null;
		// Compared as points in time: Directus returns e.g. "...:00.000Z" for "...:00Z".
		if (!currentStart || new Date(currentStart).getTime() !== new Date(MAINTENANCE_START).getTime()) {
			// JSON.stringify escapes line breaks, so values read from the API or the environment cannot forge extra log lines.
			console.log(`Maintenance window not cleared, maintenance_start is ${JSON.stringify(currentStart)} instead of ${JSON.stringify(MAINTENANCE_START)}`); // NOSONAR jssecurity:S5145 - both values are JSON.stringify-escaped (no raw line breaks) and come from the admin-only app_settings and the CI job's own env, written to CI logs only
			return;
		}
		await request('/items/app_settings', {
			method: 'PATCH',
			headers,
			body: JSON.stringify({ maintenance_start: null, maintenance_end: null }),
		});
		console.log('Maintenance window cleared');
		return;
	}

	throw new Error(`Unknown MAINTENANCE_ACTION "${MAINTENANCE_ACTION}"`);
}

try {
	await main();
} catch (error) {
	console.error(JSON.stringify(error.message)); // NOSONAR jssecurity:S5145 - JSON.stringify escapes line breaks, so an error text from the own Directus API cannot forge extra CI log lines
	process.exit(1);
}
