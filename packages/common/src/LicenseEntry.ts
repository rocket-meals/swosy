/**
 * A single entry of the auto-collected open-source license list.
 *
 * Written at build time by `collectLicenses()` (packages/common/licenses/collectLicenses.ts,
 * Node-only) and read back at runtime by the LicenseInformation component of
 * repo-depkit-common-ui. The type lives here - free of Node built-ins - so both sides
 * share one declaration instead of keeping two copies in sync.
 */
export type LicenseEntry = {
	name: string;
	version: string;
	license: string;
	repository?: string;
	licenseUrl?: string;
};
