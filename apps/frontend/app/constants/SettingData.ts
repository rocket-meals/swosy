// Themes
export const themes = [
        { id: 'light', name: 'color_scheme_light', icon: 'white-balance-sunny' },
	{ id: 'dark', name: 'color_scheme_dark', icon: 'moon-waning-crescent' },
	{ id: 'systematic', name: 'color_scheme_system', icon: 'theme-light-dark' },
];

// Languages - Dictionary for O(1) lookups by language code
export const languageDict = {
	en: {
		label: 'English (English)',
		emoji: '🇬🇧',
		value: 'en',
	},
	tr: {
		label: 'Turkish (Türkçe)',
		emoji: '🇹🇷',
		value: 'tr',
	},
	es: {
		label: 'Spanish (Español)',
		emoji: '🇪🇸',
		value: 'es',
	},
	fr: {
		label: 'French (Français)',
		emoji: '🇫🇷',
		value: 'fr',
	},
	de: {
		label: 'German (Deutsch)',
		emoji: '🇩🇪',
		value: 'de',
	},
	zh: {
		label: 'Chinese (中文)',
		emoji: '🇨🇳',
		value: 'zh',
	},
	ar: {
		label: 'Arabic (العربية)',
		emoji: '🇸🇦',
		value: 'ar',
	},
	ru: {
		label: 'Russian (Русский)',
		emoji: '🇷🇺',
		value: 'ru',
	},
} as const;

// Language order - preserves UI display order
export const languageOrder = ['en', 'tr', 'es', 'fr', 'de', 'zh', 'ar', 'ru'] as const;

// Legacy export for backward compatibility - returns ordered array
export const languages = languageOrder.map((code) => languageDict[code]);

// Drawers
export const drawers = [
	{
		id: 'left',
		name: 'drawer_config_position_left',
		icon: 'format-horizontal-align-left',
	},
	{
		id: 'right',
		name: 'drawer_config_position_right',
		icon: 'format-horizontal-align-right',
	},
	{
		id: 'system',
		name: 'drawer_config_position_system',
		icon: 'format-horizontal-align-left',
	},
];

// Amount Column
export const AmountColumn = [
	{ id: 0, name: 'Automatic' },
	{ id: 1, name: '1' },
	{ id: 2, name: '2' },
	{ id: 3, name: '3' },
	{ id: 4, name: '4' },
	{ id: 5, name: '5' },
	{ id: 6, name: '6' },
	{ id: 7, name: '7' },
	{ id: 8, name: '8' },
	{ id: 9, name: '9' },
	{ id: 10, name: '10' },
];

// First day of the week
export const days = [
	{ id: 'monday', name: 'Mon' },
	{ id: 'tuesday', name: 'Tue' },
	{ id: 'wednesday', name: 'Wed' },
	{ id: 'thursday', name: 'Thu' },
	{ id: 'friday', name: 'Fri' },
	{ id: 'saturday', name: 'Sat' },
	{ id: 'sunday', name: 'Sun' },
];

export const daysData = [
	{ id: 'monday', name: 'Mon' },
	{ id: 'tuesday', name: 'Tue' },
	{ id: 'wednesday', name: 'Wed' },
	{ id: 'thursday', name: 'Thu' },
	{ id: 'friday', name: 'Fri' },
	{ id: 'saturday', name: 'Sat' },
	{ id: 'sunday', name: 'Sun' },
];
