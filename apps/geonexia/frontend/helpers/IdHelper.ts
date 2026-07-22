import { MathHelper } from 'repo-depkit-common';

// Generates a short random suffix for locally-stored ids (activities, routes).
export function generateRandomIdSuffix(length = 7): string {
	const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += alphabet[Math.floor(MathHelper.random() * alphabet.length)];
	}
	return result;
}
