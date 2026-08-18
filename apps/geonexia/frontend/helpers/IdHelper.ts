import { UuidHelper } from 'repo-depkit-common';

// Generates a short random suffix for locally-stored ids (activities, routes).
export function generateRandomIdSuffix(length = 7): string {
	return UuidHelper.randomId(length, UuidHelper.ALPHANUMERIC_LOWERCASE);
}
