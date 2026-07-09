import type { KeyboardTypeOptions } from 'react-native';

/** Shared error/disabled state used across the various settings-list form field inputs. */
export type FormFieldStatusProps = {
	error?: string;
	isDisabled?: boolean;
};

/** Shared prefix/suffix decoration used across the various settings-list form field inputs. */
export type AffixProps = {
	prefix?: string | null;
	suffix?: string | null;
};

/** Shared modal-sheet state (current value, save button label, accent color) used across the
 * various settings-list "open a bottom sheet to edit a value" components. */
export type ModalSheetBaseProps<TValue> = {
	initialValue: TValue;
	saveLabel: string;
	primaryColor: string;
};

/** Shared text-input appearance props used by the various text-input components
 * (in this package and in the frontend app's own local text-input variant). */
export type TextInputAppearanceProps = {
	placeholder: string;
	keyboardType?: KeyboardTypeOptions;
	inputStyle?: object;
	autoFocus?: boolean;
};
