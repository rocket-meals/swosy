/**
 * Texte im Onboarding und die Fakten zu den Wissenschaftlern: keine Gedankenstriche und keine
 * Semikolons (Regel siehe README). Der Test liest die Keys direkt aus dem Onboarding-Screen, damit
 * neue Texte dort automatisch mitgeprüft werden.
 */

import * as fs from 'fs';
import * as path from 'path';
import { translationResources } from '../locales/translationResources';

/** Gedankenstriche (–, —), Semikolon und seine arabische/chinesische Form sowie ein freistehender Bindestrich als Strich-Ersatz. */
const FORBIDDEN_PUNCTUATION = /[–—;；؛]| - /;

const ONBOARDING_SCREEN = path.join(__dirname, '..', 'app', '(app)', 'experimentell', 'onboarding', 'index.tsx');

function onboardingKeys(): string[] {
	const source = fs.readFileSync(ONBOARDING_SCREEN, 'utf8');
	const keys = new Set<string>();
	for (const match of source.matchAll(/TranslationKeys\.(\w+)/g)) {
		keys.add(match[1]!);
	}
	for (const key of Object.keys(translationResources)) {
		if (key.startsWith('scientist_fact_')) keys.add(key);
	}
	return [...keys].sort();
}

describe('onboarding texts', () => {
	it('reads the keys of the onboarding screen', () => {
		expect(onboardingKeys()).toContain('onboarding_profile_title');
		expect(onboardingKeys()).toContain('scientist_fact_curie');
	});

	it('use no dashes and no semicolons in any language', () => {
		const offenders: string[] = [];
		for (const key of onboardingKeys()) {
			const texts = (translationResources as Record<string, Record<string, string>>)[key] ?? {};
			for (const [language, text] of Object.entries(texts)) {
				if (FORBIDDEN_PUNCTUATION.test(text)) offenders.push(`${key} (${language}): ${text}`);
			}
		}
		expect(offenders).toEqual([]);
	});
});
