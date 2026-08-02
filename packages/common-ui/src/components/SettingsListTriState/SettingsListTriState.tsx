import React from 'react';
import type { PropsWithChildren } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useSettingsContext } from '../../context/SettingsContext';
import SettingsList from '../SettingsList';
import type { SettingsListProps } from '../SettingsList/types';

/** The three recordable states: yes, no, or deliberately nothing at all. */
export type TriStateValue = boolean | null;

const FALSE_COLOR = '#dc2626';

type SettingsListTriStatePropsOwn = {
	/** Current state. `null` = not recorded ("keine Angabe"), the default state. */
	value: TriStateValue;
	onChange: (next: TriStateValue) => void;
	disabled?: boolean;
	/** Value label of the `true` state. */
	labelTrue?: string;
	/** Value label of the `false` state. */
	labelFalse?: string;
	/** Value label of the `null` state. */
	labelUnset?: string;
};

export type SettingsListTriStateProps = PropsWithChildren<
	Omit<SettingsListProps, 'rightElement' | 'rightIcon' | 'onPress' | 'handleFunction' | 'value'> & SettingsListTriStatePropsOwn
>;

/** Tap cycle: not recorded → yes → no → not recorded. */
function nextTriState(value: TriStateValue): TriStateValue {
	if (value === null) return true;
	if (value === true) return false;
	return null;
}

/**
 * A settings row holding a tri-state answer: yes, no or unset. Behaves like a
 * checkbox - tapping the row cycles through the three states, each with its
 * own checkbox icon on the right: empty box (unset, the default), checked box
 * (yes), crossed box (no). Unlike `SettingsListBoolean`'s switch, "nothing
 * recorded" is a first-class state.
 */
const SettingsListTriState: React.FC<SettingsListTriStateProps> = ({
	value,
	onChange,
	disabled = false,
	labelTrue = 'Ja',
	labelFalse = 'Nein',
	labelUnset = 'Keine Angabe',
	isAccountRequired,
	primaryColor,
	...props
}) => {
	const { theme } = useTheme();
	const settingsCtx = useSettingsContext();
	const isDisabled = disabled || !!isAccountRequired;
	const resolvedPrimaryColor = primaryColor ?? settingsCtx?.primaryColor ?? theme.primary;

	let valueLabel = labelUnset;
	let iconName: 'checkbox-blank-outline' | 'checkbox-marked' | 'close-box' = 'checkbox-blank-outline';
	let iconColor = theme.screen.icon;
	if (value === true) {
		valueLabel = labelTrue;
		iconName = 'checkbox-marked';
		iconColor = resolvedPrimaryColor;
	} else if (value === false) {
		valueLabel = labelFalse;
		iconName = 'close-box';
		iconColor = FALSE_COLOR;
	}

	return (
		<SettingsList
			{...props}
			primaryColor={resolvedPrimaryColor}
			isAccountRequired={isAccountRequired}
			value={valueLabel}
			rightElement={<MaterialCommunityIcons name={iconName} size={26} color={isDisabled ? theme.screen.border : iconColor} />}
			handleFunction={isDisabled ? undefined : () => onChange(nextTriState(value))}
		/>
	);
};

export default SettingsListTriState;
