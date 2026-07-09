import { PropsWithChildren } from 'react';

export type SettingsListSelectableItemBase<T> = {
	id: T;
	label: string;
	icon?: React.ReactNode;
};

export type SettingsListItemBaseProps = {
	leftIcon?: React.ReactNode;
	iconBgColor?: string;
	label?: string;
	onPress?: () => void;
	showSeparator?: boolean;
	noIconIndent?: boolean;
};

type SettingsListPropsOwn = SettingsListItemBaseProps & {
	/**
	 * Element identifier for automated testing (e.g. Maestro).
	 * Rendered as `nativeID` (HTML `id` attribute) so Maestro web tests can locate the element.
	 * Always use `nativeID={ComponentIds.XXX}` on the component, not `testID`.
	 */
	nativeID?: string;
	/**
	 * Custom component rendered in place of the default left icon wrapper.
	 */
	leftIconComponent?: React.ReactNode;
	/**
	 * Title text for the row. "label" is kept for backwards
	 * compatibility with the old `SettingList` component.
	 */
	title?: string;
	value?: string;
	/**
	 * Element rendered on the right side. "rightIcon" is kept for
	 * backwards compatibility with the old `SettingList` component.
	 */
	rightElement?: React.ReactNode;
	rightIcon?: React.ReactNode;
	/**
	 * Press handler. "handleFunction" is kept for backwards
	 * compatibility with the old `SettingList` component.
	 */
	handleFunction?: () => void;
	/**
	 * Background color of the left icon wrapper. "iconBgColor" is
	 * kept for backwards compatibility with the old `SettingList`
	 * component.
	 */
	iconBackgroundColor?: string;
	/**
	 * Visual grouping support. When set to "top" the item receives a
	 * rounded top border and extra padding at the top. "bottom" applies
	 * the same to the bottom side. "single" rounds all corners and
	 * adds padding on both sides. "middle" leaves the default styling.
	 */
	groupPosition?: 'top' | 'middle' | 'bottom' | 'single';
	/**
	 * Render the title in italic style.
	 */
	italic?: boolean;
	/**
	 * Maximum number of lines for the title text. Defaults to 0 (unlimited).
	 */
	titleNumberOfLines?: number;
	/**
	 * When true the item is shown with a dashed border (using the primary
	 * color) and a semi-transparent dim overlay with a centered lock icon to
	 * indicate that an account is required. The original left icon is kept
	 * unchanged.
	 */
	isAccountRequired?: boolean;
	/**
	 * Group position used for the account-required dashed border. Defaults to
	 * `groupPosition`, where 'middle'/'bottom' rows skip the top border line on
	 * the assumption that the row above is part of the same locked block and
	 * already draws it. A locked row whose neighbours are NOT account-required
	 * (e.g. a single locked row in the middle of a normal group) should pass
	 * 'single' so its outline is fully closed.
	 */
	accountRequiredGroupPosition?: 'top' | 'middle' | 'bottom' | 'single';
	/**
	 * The primary/accent color used as the default icon background. Falls
	 * back to the theme's primary color when omitted.
	 */
	primaryColor?: string;
	/**
	 * Called when the user presses an item that has `isAccountRequired` set to
	 * true. Consuming apps can use this to open an account-required modal.
	 */
	onAccountRequired?: () => void;
};

export type SettingsListProps = PropsWithChildren<SettingsListPropsOwn>;
