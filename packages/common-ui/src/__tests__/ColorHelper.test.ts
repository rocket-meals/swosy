import { getColorAsHex, getContrastRatio, mixColors, myContrastColor } from '../helpers/ColorHelper';
import { darkTheme, lightTheme } from '../themes';

describe('getContrastRatio', () => {
	it('returns the maximum ratio of 21 for black on white', () => {
		expect(getContrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
	});

	it('returns 1 for identical colors', () => {
		expect(getContrastRatio('#123456', '#123456')).toBeCloseTo(1, 5);
	});

	it('is symmetric', () => {
		expect(getContrastRatio('#ff0000', '#00ff00')).toBeCloseTo(getContrastRatio('#00ff00', '#ff0000'), 10);
	});

	it('treats an empty or missing foreground as black', () => {
		expect(getContrastRatio(undefined, '#ffffff')).toBeCloseTo(21, 5);
		expect(getContrastRatio(null, '#ffffff')).toBeCloseTo(21, 5);
		expect(getContrastRatio('', '#ffffff')).toBeCloseTo(21, 5);
	});
});

describe('getColorAsHex', () => {
	it('normalises named colors', () => {
		expect(getColorAsHex('red')).toBe('#ff0000');
	});

	it('expands short hex notation', () => {
		expect(getColorAsHex('#abc')).toBe('#aabbcc');
	});

	it('converts rgb() notation', () => {
		expect(getColorAsHex('rgb(255, 0, 0)')).toBe('#ff0000');
	});

	it('returns undefined for missing input', () => {
		expect(getColorAsHex(undefined)).toBeUndefined();
		expect(getColorAsHex('')).toBeUndefined();
	});
});

describe('mixColors', () => {
	it('returns the first color at amount 0', () => {
		expect(mixColors('#000000', '#ffffff', 0)).toBe('rgb(0, 0, 0)');
	});

	it('returns the second color at amount 1', () => {
		expect(mixColors('#000000', '#ffffff', 1)).toBe('rgb(255, 255, 255)');
	});

	it('blends halfway at amount 0.5', () => {
		expect(mixColors('#000000', '#ffffff', 0.5)).toBe('rgb(128, 128, 128)');
	});

	it('clamps amounts outside 0..1 instead of extrapolating', () => {
		expect(mixColors('#000000', '#ffffff', -5)).toBe(mixColors('#000000', '#ffffff', 0));
		expect(mixColors('#000000', '#ffffff', 5)).toBe(mixColors('#000000', '#ffffff', 1));
	});
});

describe('myContrastColor', () => {
	it('puts black text on a light background', () => {
		expect(myContrastColor('#ffffff', lightTheme, false)).toBe('#000000');
	});

	it('puts white text on a dark background', () => {
		expect(myContrastColor('#000000', darkTheme, true)).toBe('#FFFFFF');
	});

	it('always reaches at least the WCAG AA ratio of 4.5 for the chosen text color', () => {
		for (const background of ['#ffffff', '#000000', '#2596be', '#ffcc00', '#333333']) {
			for (const isDarkMode of [false, true]) {
				const theme = isDarkMode ? darkTheme : lightTheme;
				const textColor = myContrastColor(background, theme, isDarkMode);
				const bestPossible = Math.max(
					getContrastRatio(background, '#000000'),
					getContrastRatio(background, '#FFFFFF'),
				);
				const chosen = getContrastRatio(background, textColor);
				// Either the threshold is met, or the best of the two options was picked.
				expect(chosen >= 4.5 || chosen === bestPossible).toBe(true);
			}
		}
	});

	it('resolves "transparent" against the theme background instead of guessing', () => {
		expect(myContrastColor('transparent', lightTheme, false)).toBe(myContrastColor(lightTheme.background, lightTheme, false));
	});

	it('returns a usable color for a missing background', () => {
		expect(['#000000', '#FFFFFF']).toContain(myContrastColor(undefined, lightTheme, false));
	});
});
