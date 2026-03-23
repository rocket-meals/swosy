import Color from 'tinycolor2';
import { Theme } from '../themes';

export function getContrastRatio(foreground: string | undefined | null, background: string): number {
	const usedForeground = foreground ? foreground : undefined;
	const lumA = Color(usedForeground).getLuminance();
	const lumB = Color(background).getLuminance();
	return (Math.max(lumA, lumB) + 0.05) / (Math.min(lumA, lumB) + 0.05);
}

export function getColorAsHex(color: string | undefined): string | undefined {
	if (!color) {
		return undefined;
	}
	return Color(color).toHexString();
}

enum ContrastThreshold {
	MaternaLandNiedersachsen = 4.5,
	WCAG_AA = 3.0,
	WCAG_AAA = 7.0,
}

function getViewBackgroundColor(theme: Theme): string | undefined {
	return getColorAsHex(theme?.background);
}

function getContrastColorByMode(trueBg: string | undefined | null, isDarkMode: boolean, contrastThreshold: number): string {
	const trueDarkText = '#000000';
	const trueLightText = '#FFFFFF';

	const darkTextContrast = getContrastRatio(trueBg, trueDarkText);
	const lightTextContrast = getContrastRatio(trueBg, trueLightText);

	if (isDarkMode && lightTextContrast >= contrastThreshold) return trueLightText;
	if (!isDarkMode && darkTextContrast >= contrastThreshold) return trueDarkText;

	return darkTextContrast > lightTextContrast ? trueDarkText : trueLightText;
}

/**
 * Determines the most readable contrast color for a given background, considering theme mode.
 */
export function myContrastColor(trueBg: string | undefined | null, theme: Theme, isDarkMode: boolean): string {
	const viewBackgroundColor = getViewBackgroundColor(theme);

	if (trueBg === 'transparent') {
		trueBg = viewBackgroundColor ?? null;
	}

	return getContrastColorByMode(trueBg, isDarkMode, ContrastThreshold.MaternaLandNiedersachsen);
}
