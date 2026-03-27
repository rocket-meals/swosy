import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import type { PropsWithChildren } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useSettingsContext } from '../../context/SettingsContext';
import SettingsList from '../SettingsList';
import type { SettingsListProps } from '../SettingsList/types';
import { lightTheme } from '../../themes';
import { borderRadiusContainer, horizontalScreenPadding } from '../../constants/ui';

const ICON_WIDTH = 34;
const ICON_MARGIN_RIGHT = 10;
const PROGRESS_LEFT_OFFSET = horizontalScreenPadding + ICON_WIDTH + ICON_MARGIN_RIGHT;

type SettingsListProgressOwnProps = {
	description?: string;
	progress: number;
	progressText?: string;
	progressColor?: string;
};

export type SettingsListProgressProps = PropsWithChildren<
	Omit<SettingsListProps, 'value' | 'rightElement' | 'rightIcon'> & SettingsListProgressOwnProps
>;

const SettingsListProgress: React.FC<SettingsListProgressProps> = ({
	description,
	progress,
	progressText,
	progressColor,
	primaryColor,
	showSeparator = true,
	groupPosition,
	...settingsListProps
}) => {
	const { theme } = useTheme();
	const settingsCtx = useSettingsContext();
	const resolvedProgressColor = progressColor ?? primaryColor ?? settingsCtx?.primaryColor ?? lightTheme.primary;
	const clampedProgress = Math.min(1, Math.max(0, progress));

	let wrapperStyle: ViewStyle = {};
	if (groupPosition === 'top') {
		wrapperStyle = { borderTopLeftRadius: borderRadiusContainer, borderTopRightRadius: borderRadiusContainer };
	} else if (groupPosition === 'bottom') {
		wrapperStyle = { borderBottomLeftRadius: borderRadiusContainer, borderBottomRightRadius: borderRadiusContainer };
	} else if (groupPosition === 'single') {
		wrapperStyle = { borderRadius: borderRadiusContainer };
	}

	return (
		<>
			<View style={[styles.wrapper, { backgroundColor: theme.screen.iconBg }, wrapperStyle]}>
				<SettingsList
					{...settingsListProps}
					primaryColor={primaryColor}
					showSeparator={false}
					groupPosition={undefined}
				/>
				<View style={styles.progressSection}>
					{description ? (
						<Text style={[styles.description, { color: theme.screen.icon }]}>
							{description}
						</Text>
					) : null}
					<View style={styles.progressRow}>
						<View style={[styles.progressBarBg, { backgroundColor: theme.screen.icon + '30' }]}>
							<View
								style={[
									styles.progressBarFill,
									{
										width: `${Math.round(clampedProgress * 100)}%` as `${number}%`,
										backgroundColor: resolvedProgressColor,
									},
								]}
							/>
						</View>
						{progressText ? (
							<Text style={[styles.progressText, { color: theme.screen.icon }]}>
								{progressText}
							</Text>
						) : null}
					</View>
				</View>
			</View>
			{showSeparator ? (
				<View style={[styles.separator, { backgroundColor: theme.screen.background }]} />
			) : null}
		</>
	);
};

export default SettingsListProgress;

const styles = StyleSheet.create({
	wrapper: {
		width: '100%',
	},
	progressSection: {
		paddingLeft: PROGRESS_LEFT_OFFSET,
		paddingRight: horizontalScreenPadding,
		paddingBottom: 10,
		gap: 4,
	},
	description: {
		fontSize: 12,
		lineHeight: 16,
	},
	progressRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	progressBarBg: {
		flex: 1,
		height: 4,
		borderRadius: 2,
		overflow: 'hidden',
	},
	progressBarFill: {
		height: 4,
		borderRadius: 2,
	},
	progressText: {
		fontSize: 11,
		fontWeight: '500',
		minWidth: 70,
		textAlign: 'right',
	},
	separator: {
		width: '100%',
		height: StyleSheet.hairlineWidth,
	},
});
