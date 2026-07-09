/**
 * Shared prop shapes for `SettingsList`-based row components.
 *
 * These were duplicated verbatim across several components' local `Props`
 * types (see data-clumps-doctor report). Extracted here so each component
 * intersects the appropriate base instead of re-declaring the same fields.
 */

/** Position of a row within its settings group, used for rounded-corner styling. */
export type SettingsListGroupPosition = 'top' | 'middle' | 'bottom' | 'single';

/**
 * Common props for a simple pressable `SettingsList` row (e.g. activity,
 * route, or map-feature rows) that renders within a group and optionally
 * shows a separator below it.
 */
export type SettingsListPressableItemProps = {
	groupPosition?: SettingsListGroupPosition;
	showSeparator?: boolean;
	onPress?: () => void;
};

/**
 * Common props for a pressable `SettingsList` row that supports single-select
 * (radio button) behavior, such as a billboard or hex-tile picker row.
 */
export type SettingsListSelectablePressableItemProps = {
	/** Label shown as the row title. */
	title?: string;
	/** Called when the row is pressed (e.g. to open a selection modal). */
	onPress?: () => void;
	groupPosition?: SettingsListGroupPosition;
	/** When true, renders a filled radio button on the right side. */
	isSelected?: boolean;
	/** Color used for the radio button when isSelected is true. */
	selectionColor?: string;
};
