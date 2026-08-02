import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { PropsWithChildren } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useSettingsContext } from '../../context/SettingsContext';
import SettingsList from '../SettingsList';
import type { SettingsListProps } from '../SettingsList/types';

/** The three recordable states: yes, no, or deliberately nothing at all. */
export type TriStateValue = boolean | null;

type SettingsListTriStatePropsOwn = {
	/** Current state. `null` = not recorded ("keine Angabe"), the default state. */
	value: TriStateValue;
	onChange: (next: TriStateValue) => void;
	disabled?: boolean;
	/** Segment/value label of the `true` state. */
	labelTrue?: string;
	/** Segment/value label of the `false` state. */
	labelFalse?: string;
	/** Value label of the `null` state (the segment itself shows a dash). */
	labelUnset?: string;
};

export type SettingsListTriStateProps = PropsWithChildren<
	Omit<SettingsListProps, 'rightElement' | 'rightIcon' | 'onPress' | 'handleFunction' | 'value'> & SettingsListTriStatePropsOwn
>;

/**
 * A settings row holding a tri-state answer: yes, no or unset. Unlike
 * `SettingsListBoolean`'s switch (which can only express on/off), the three
 * segments on the right make "nothing recorded" a first-class state - tapping
 * the already selected yes/no segment clears back to unset as well.
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

	const segments: { key: string; segmentLabel: string; segmentValue: TriStateValue }[] = [
		{ key: 'true', segmentLabel: labelTrue, segmentValue: true },
		{ key: 'false', segmentLabel: labelFalse, segmentValue: false },
		{ key: 'unset', segmentLabel: '—', segmentValue: null },
	];

	let valueLabel = labelUnset;
	if (value === true) valueLabel = labelTrue;
	if (value === false) valueLabel = labelFalse;

	return (
		<SettingsList
			{...props}
			primaryColor={resolvedPrimaryColor}
			isAccountRequired={isAccountRequired}
			value={valueLabel}
			rightElement={
				<View style={[styles.segmentRow, { borderColor: theme.screen.border }]}>
					{segments.map((segment, index) => {
						const isSelected = value === segment.segmentValue;
						// The unset segment has no darker "selected" look of its own -
						// unset is simply the absence of both others.
						const showSelected = isSelected && segment.segmentValue !== null;
						return (
							<TouchableOpacity
								key={segment.key}
								nativeID={props.nativeID ? `${props.nativeID}-${segment.key}` : undefined}
								style={[
									styles.segment,
									index > 0 && [styles.segmentDivider, { borderLeftColor: theme.screen.border }],
									showSelected && { backgroundColor: resolvedPrimaryColor },
								]}
								disabled={isDisabled}
								// Tapping the selected yes/no again clears back to unset.
								onPress={() => onChange(isSelected ? null : segment.segmentValue)}
								activeOpacity={0.7}
								accessibilityRole="button"
								accessibilityState={{ selected: isSelected, disabled: isDisabled }}
								accessibilityLabel={`${props.title ?? props.label ?? ''}: ${segment.segmentValue === null ? labelUnset : segment.segmentLabel}`}
							>
								<Text
									style={[
										styles.segmentText,
										{ color: showSelected ? '#ffffff' : theme.screen.text },
										isDisabled && styles.segmentTextDisabled,
									]}
								>
									{segment.segmentLabel}
								</Text>
							</TouchableOpacity>
						);
					})}
				</View>
			}
		/>
	);
};

const styles = StyleSheet.create({
	segmentRow: {
		flexDirection: 'row',
		borderWidth: 1,
		borderRadius: 8,
		overflow: 'hidden',
	},
	segment: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		minWidth: 44,
		alignItems: 'center',
		justifyContent: 'center',
	},
	segmentDivider: {
		borderLeftWidth: 1,
	},
	segmentText: {
		fontSize: 13,
		fontWeight: '600',
	},
	segmentTextDisabled: {
		opacity: 0.4,
	},
});

export default SettingsListTriState;
