import { FAMOUS_SCIENTISTS } from 'repo-depkit-common';
import { getScientistFactKey, SCIENTIST_FACT_KEYS } from '@/helper/scientistFactHelper';

describe('scientistFactHelper', () => {
	it('has a fact for every scientist a profile can start with', () => {
		for (const scientist of FAMOUS_SCIENTISTS) {
			expect(getScientistFactKey(scientist)).not.toBeNull();
		}
	});

	it('has no facts for scientists that are not in the list', () => {
		const nicknames = FAMOUS_SCIENTISTS.map(scientist => scientist.nickname).sort();
		expect(Object.keys(SCIENTIST_FACT_KEYS).sort()).toEqual(nicknames);
	});
});
