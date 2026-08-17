import {
	getDefaultKnobValues,
	getPlaybookEntryData,
	getPlaybookPath,
	parseKnobValue,
	playbookRegistryData,
	resolveKnobValues,
	type KnobDefinition,
	type PlaybookEntryData,
} from '../playbook/registryData';

const TEXT_KNOB: KnobDefinition = { type: 'text', defaultValue: 'default' };
const BOOLEAN_KNOB: KnobDefinition = { type: 'boolean', defaultValue: true };
const NUMBER_KNOB: KnobDefinition = { type: 'number', defaultValue: 42 };
const SELECT_KNOB: KnobDefinition = { type: 'select', defaultValue: 'a', options: ['a', 'b'] };

const ENTRY: PlaybookEntryData = {
	name: 'Example',
	description: 'Example entry',
	knobs: { label: TEXT_KNOB, enabled: BOOLEAN_KNOB, size: NUMBER_KNOB, variant: SELECT_KNOB },
};

describe('playbookRegistryData', () => {
	it('has a unique name per entry', () => {
		const names = playbookRegistryData.map((entry) => entry.name);
		expect(new Set(names).size).toBe(names.length);
	});

	it('gives every entry a non-empty description', () => {
		for (const entry of playbookRegistryData) {
			expect(entry.description?.trim()).toBeTruthy();
		}
	});

	it('gives every select knob a non-empty options list containing its default', () => {
		for (const entry of playbookRegistryData) {
			for (const [knobName, knob] of Object.entries(entry.knobs)) {
				if (knob.type !== 'select') continue;
				expect(knob.options ?? []).not.toHaveLength(0);
				expect(knob.options).toContain(knob.defaultValue);
				expect(knobName.length).toBeGreaterThan(0);
			}
		}
	});

	it('types every default value consistently with the knob type', () => {
		for (const entry of playbookRegistryData) {
			for (const knob of Object.values(entry.knobs)) {
				if (knob.type === 'boolean') expect(typeof knob.defaultValue).toBe('boolean');
				if (knob.type === 'number') expect(typeof knob.defaultValue).toBe('number');
				if (knob.type === 'text' || knob.type === 'select') expect(typeof knob.defaultValue).toBe('string');
			}
		}
	});
});

describe('getPlaybookEntryData', () => {
	it('finds an entry by name', () => {
		const first = playbookRegistryData[0];
		expect(getPlaybookEntryData(first?.name ?? '')).toBe(first);
	});

	it('returns undefined for an unknown name', () => {
		expect(getPlaybookEntryData('DoesNotExist')).toBeUndefined();
	});
});

describe('getPlaybookPath', () => {
	it('builds the playbook route for an entry', () => {
		expect(getPlaybookPath('SettingsList')).toBe('/experimentell/playbook/SettingsList');
	});
});

describe('getDefaultKnobValues', () => {
	it('returns every knob with its default', () => {
		expect(getDefaultKnobValues(ENTRY)).toEqual({ label: 'default', enabled: true, size: 42, variant: 'a' });
	});

	it('returns an empty object for an entry without knobs', () => {
		expect(getDefaultKnobValues({ name: 'X', description: 'x', knobs: {} })).toEqual({});
	});
});

describe('parseKnobValue', () => {
	it('falls back to the default for missing input', () => {
		expect(parseKnobValue(TEXT_KNOB, undefined)).toBe('default');
		expect(parseKnobValue(BOOLEAN_KNOB, undefined)).toBe(true);
	});

	it('parses booleans only from the exact strings "true" and "false"', () => {
		expect(parseKnobValue(BOOLEAN_KNOB, 'false')).toBe(false);
		expect(parseKnobValue(BOOLEAN_KNOB, 'true')).toBe(true);
		expect(parseKnobValue(BOOLEAN_KNOB, 'TRUE')).toBe(true); // invalid -> default (true)
		expect(parseKnobValue({ type: 'boolean', defaultValue: false }, 'yes')).toBe(false);
	});

	it('parses numbers and falls back for non-numeric input', () => {
		expect(parseKnobValue(NUMBER_KNOB, '7')).toBe(7);
		expect(parseKnobValue(NUMBER_KNOB, '-1.5')).toBe(-1.5);
		expect(parseKnobValue(NUMBER_KNOB, 'abc')).toBe(42);
	});

	it('accepts select values only from the options list', () => {
		expect(parseKnobValue(SELECT_KNOB, 'b')).toBe('b');
		expect(parseKnobValue(SELECT_KNOB, 'c')).toBe('a');
	});

	it('passes text through verbatim, including the empty string', () => {
		expect(parseKnobValue(TEXT_KNOB, 'hello')).toBe('hello');
		expect(parseKnobValue(TEXT_KNOB, '')).toBe('');
	});
});

describe('resolveKnobValues', () => {
	it('reads values from query params and defaults the rest', () => {
		expect(resolveKnobValues(ENTRY, { label: 'from-url', size: '9' })).toEqual({
			label: 'from-url',
			enabled: true,
			size: 9,
			variant: 'a',
		});
	});

	it('uses the first entry when expo-router hands over a repeated param', () => {
		expect(resolveKnobValues(ENTRY, { variant: ['b', 'a'] }).variant).toBe('b');
	});

	it('ignores params that are not knobs of the entry', () => {
		expect(resolveKnobValues(ENTRY, { unrelated: 'x' })).toEqual(getDefaultKnobValues(ENTRY));
	});
});
