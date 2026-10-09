/**
 * Colors and icons of the choices of a Directus field (e.g. `feature_whishes.status`), as they are
 * set in the Directus data model. The app shows them so a status looks the same as in Directus.
 *
 * Directus stores icons as Material Symbols names (`forward_to_inbox`, `robot_2`) and colors as hex
 * or as CSS variables of its theme (`var(--theme--primary)`). Both are translated here; texts stay in
 * the app's translation catalogue because Directus only has one language for them.
 */

export type DirectusFieldChoice = {
	value: string;
	text?: string | null;
	color?: string | null;
	icon?: string | null;
};

const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** Directus theme variables mapped to app colors; `primary` follows the app's primary color. */
const THEME_VARIABLE_COLORS: Record<string, string | 'primary' | 'text'> = {
	'--theme--primary': 'primary',
	'--theme--foreground': 'text',
	'--theme--warning': '#E0A800',
	'--theme--danger': '#E35169',
	'--theme--success': '#2ECDA7',
	'--theme--secondary': '#A2B5CD',
};

export class DirectusFieldChoiceHelper {
	static getKey(collection: string, field: string): string {
		return `${collection}.${field}`;
	}

	/** The choices of a field from the answer of `GET /fields/:collection/:field`. */
	static parseChoices(field: unknown): DirectusFieldChoice[] {
		const choices = (field as { meta?: { options?: { choices?: unknown } } } | null)?.meta?.options?.choices;
		if (!Array.isArray(choices)) {
			return [];
		}
		return choices
			.filter((choice): choice is DirectusFieldChoice => typeof (choice as DirectusFieldChoice)?.value === 'string')
			.map(choice => ({ value: choice.value, text: choice.text ?? null, color: choice.color ?? null, icon: choice.icon ?? null }));
	}

	static findChoice(choices: DirectusFieldChoice[] | null | undefined, value: string | null | undefined): DirectusFieldChoice | undefined {
		if (!value) {
			return undefined;
		}
		return (choices ?? []).find(choice => choice.value === value);
	}

	/** A color the app can draw, or null when Directus has none or an unknown one. */
	static resolveColor(color: string | null | undefined, appColors: { primary: string; text: string }): string | null {
		if (!color) {
			return null;
		}
		const trimmed = color.trim();
		if (HEX_COLOR.test(trimmed)) {
			return trimmed;
		}
		const variable = /^var\(\s*(--[a-z0-9-]+)\s*\)$/i.exec(trimmed)?.[1];
		const mapped = variable ? THEME_VARIABLE_COLORS[variable] : undefined;
		if (mapped === 'primary') {
			return appColors.primary;
		}
		if (mapped === 'text') {
			return appColors.text;
		}
		return mapped ?? null;
	}

	/**
	 * Directus' own icon picker stores Material Symbols names (`forward_to_inbox`), while the app's
	 * `Icon` takes `family:name`. Material Icons uses the same names with dashes, so this returns
	 * `MaterialIcons:forward-to-inbox`, or null when Material Icons has no such icon.
	 */
	static toIconName(icon: string | null | undefined, materialIconsGlyphMap: Record<string, unknown>): string | null {
		const materialName = icon?.trim().toLowerCase().split('_').join('-');
		return materialName && materialName in materialIconsGlyphMap ? `MaterialIcons:${materialName}` : null;
	}
}
