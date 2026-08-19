import { StringHelper } from '../StringHelper';

describe('StringHelper.replaceAllLiteralWithOptions', () => {
	it('replaces every occurrence', () => {
		expect(StringHelper.replaceAllLiteralWithOptions({ str: 'a-b-c', find: '-', replace: '_' })).toBe('a_b_c');
	});

	it('treats the needle literally, not as a regex', () => {
		expect(StringHelper.replaceAllLiteralWithOptions({ str: 'a.b.c', find: '.', replace: '-' })).toBe('a-b-c');
		expect(StringHelper.replaceAllLiteralWithOptions({ str: 'a*b', find: '*', replace: 'X' })).toBe('aXb');
		expect(StringHelper.replaceAllLiteralWithOptions({ str: 'a(b)c', find: '(b)', replace: 'X' })).toBe('aXc');
	});

	it('does not interpret `$&` in the replacement', () => {
		expect(StringHelper.replaceAllLiteralWithOptions({ str: 'ab', find: 'a', replace: '$&' })).toBe('$&b');
	});

	it('returns the input unchanged when the needle is absent', () => {
		expect(StringHelper.replaceAllLiteralWithOptions({ str: 'abc', find: 'z', replace: 'X' })).toBe('abc');
	});

	it('can delete by replacing with an empty string', () => {
		expect(StringHelper.replaceAllLiteralWithOptions({ str: 'a b c', find: ' ', replace: '' })).toBe('abc');
	});

	it('handles an empty input string', () => {
		expect(StringHelper.replaceAllLiteralWithOptions({ str: '', find: 'a', replace: 'b' })).toBe('');
	});
});

describe('StringHelper.replaceAllWithOptions', () => {
	it('replaces all matches by default (global flag)', () => {
		expect(StringHelper.replaceAllWithOptions({ str: 'a1b2c3', find: '\\d', replace: '#' })).toBe('a#b#c#');
	});

	it('honours explicit flags', () => {
		expect(StringHelper.replaceAllWithOptions({ str: 'aAa', find: 'a', replace: 'X', flags: 'gi' })).toBe('XXX');
		expect(StringHelper.replaceAllWithOptions({ str: 'aAa', find: 'a', replace: 'X', flags: 'g' })).toBe('XAX');
	});

	it('supports character classes and anchors', () => {
		expect(StringHelper.replaceAllWithOptions({ str: '  padded  ', find: '^\\s+|\\s+$', replace: '' })).toBe('padded');
	});
});

describe('StringHelper.replaceAllWithCallback', () => {
	it('calls the callback for every match', () => {
		expect(
			StringHelper.replaceAllWithCallback({ str: 'a1b22c', find: /\d+/, replace: (match) => `[${match}]` }),
		).toBe('a[1]b[22]c');
	});

	it('adds the global flag when the pattern lacks it', () => {
		expect(StringHelper.replaceAllWithCallback({ str: 'aaa', find: /a/, replace: () => 'b' })).toBe('bbb');
	});

	it('keeps an already global pattern working', () => {
		expect(StringHelper.replaceAllWithCallback({ str: 'aaa', find: /a/g, replace: () => 'b' })).toBe('bbb');
	});

	it('preserves other flags while adding the global one', () => {
		expect(StringHelper.replaceAllWithCallback({ str: 'aAa', find: /a/i, replace: () => 'x' })).toBe('xxx');
	});

	it('passes capture groups to the callback', () => {
		expect(
			StringHelper.replaceAllWithCallback({
				str: '2026-08-17',
				find: /(\d{4})-(\d{2})-(\d{2})/,
				replace: (_match, year, month, day) => `${day}.${month}.${year}`,
			}),
		).toBe('17.08.2026');
	});
});

describe('StringHelper.capitalizeFirstLetter', () => {
	it('uppercases the first letter', () => {
		expect(StringHelper.capitalizeFirstLetter('hallo')).toBe('Hallo');
	});

	it('leaves an already capitalised string alone', () => {
		expect(StringHelper.capitalizeFirstLetter('Hallo')).toBe('Hallo');
	});

	it('leaves the rest of the string untouched', () => {
		expect(StringHelper.capitalizeFirstLetter('hALLO welt')).toBe('HALLO welt');
	});

	it('handles an empty string', () => {
		expect(StringHelper.capitalizeFirstLetter('')).toBe('');
	});

	it('passes non-letters through', () => {
		expect(StringHelper.capitalizeFirstLetter('1abc')).toBe('1abc');
	});
});

describe('StringHelper space constants', () => {
	it('exposes zero-width, non-breaking and half non-breaking spaces', () => {
		expect(StringHelper.EMPTY_SPACE).toBe('​');
		expect(StringHelper.NONBREAKING_SPACE).toBe(' ');
		expect(StringHelper.NONBREAKING_HALF_SPACE).toBe(' ');
	});

	it('keeps the non-breaking spaces distinct from a normal space', () => {
		expect(StringHelper.NONBREAKING_SPACE).not.toBe(' ');
		expect(StringHelper.NONBREAKING_HALF_SPACE).not.toBe(StringHelper.NONBREAKING_SPACE);
	});
});
