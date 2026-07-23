/**
 * A labeled UI element with optional accent colors, shared by otherwise
 * unrelated components (a debug action button, a settings-list avatar row)
 * that each happen to expose the same label/background/border trio.
 */
export type LabeledAccentProps = {
	label: string;
	backgroundColor?: string;
	borderColor?: string;
};
