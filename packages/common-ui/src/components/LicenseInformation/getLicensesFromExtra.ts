import type { LicensePackageInfo } from './LicenseInformation';

/**
 * Extracts the open-source license list an app's app.config.ts placed into
 * `extra.licenses` (see packages/common/licenses/collectLicenses.ts) from
 * `Constants.expoConfig?.extra`.
 *
 * Kept dependency-free of `expo-constants` so common-ui doesn't need it as a
 * peer dependency - pass `Constants.expoConfig?.extra` from the app.
 */
export function getLicensesFromExtra(extra: unknown): LicensePackageInfo[] {
	const licenses = (extra as { licenses?: unknown } | undefined)?.licenses;
	return Array.isArray(licenses) ? (licenses as LicensePackageInfo[]) : [];
}
