import React, { useState } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import type { PropsWithChildren } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { BoxplotStats } from 'repo-depkit-common';
import { useTheme } from '../../context/ThemeContext';
import { useSettingsContext } from '../../context/SettingsContext';
import SettingsList from '../SettingsList';
import type { SettingsListProps } from '../SettingsList/types';
import Boxplot from '../Boxplot';
import { lightTheme } from '../../themes';
import { borderRadiusContainer, horizontalScreenPadding } from '../../constants/ui';

const ICON_WIDTH = 34;
const ICON_MARGIN_RIGHT = 10;
const CONTENT_LEFT_OFFSET = horizontalScreenPadding + ICON_WIDTH + ICON_MARGIN_RIGHT;

const DEFAULT_DESCRIPTION =
	'Die Box zeigt den Bereich der mittleren 50 % aller Messwerte (vom unteren zum oberen Quartil), der Strich in der Box ist der Median. Die dünnen Linien an den Enden (Antennen) markieren den kleinsten und größten gemessenen Wert.';

type SettingsListBoxplotOwnProps = {
	stats: BoxplotStats;
	/** Explanation shown below the plot once expanded. Defaults to a generic "how to read a boxplot" text. */
	description?: string;
	formatValue?: (value: number) => string;
	boxplotColor?: string;
	/** Whether the explanation is shown initially, without the user tapping the row. Defaults to false. */
	initiallyExpanded?: boolean;
};

export type SettingsListBoxplotProps = PropsWithChildren<
	Omit<SettingsListProps, 'value' | 'rightElement' | 'rightIcon' | 'onPress' | 'handleFunction'> &
		SettingsListBoxplotOwnProps
>;

const SettingsListBoxplot: React.FC<SettingsListBoxplotProps> = ({
	stats,
	description,
	formatValue,
	boxplotColor,
	primaryColor,
	initiallyExpanded = false,
	showSeparator = true,
	groupPosition,
	...settingsListProps
}) => {
	const { theme } = useTheme();
	const settingsCtx = useSettingsContext();
	const resolvedColor = boxplotColor ?? primaryColor ?? settingsCtx?.primaryColor ?? lightTheme.primary;
	const [expanded, setExpanded] = useState(initiallyExpanded);

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
					onPress={() => setExpanded((current) => !current)}
					rightIcon={
						<MaterialCommunityIcons
							name={expanded ? 'chevron-up' : 'chevron-down'}
							size={22}
							color={theme.screen.icon}
						/>
					}
				/>
				<View style={styles.plotSection}>
					<Boxplot stats={stats} color={resolvedColor} formatValue={formatValue} />
				</View>
				{expanded ? (
					<View style={styles.descriptionSection}>
						<Text style={[styles.description, { color: theme.screen.icon }]}>
							{description ?? DEFAULT_DESCRIPTION}
						</Text>
					</View>
				) : null}
			</View>
			{showSeparator ? (
				<View style={[styles.separator, { backgroundColor: theme.screen.background }]} />
			) : null}
		</>
	);
};

export default SettingsListBoxplot;

const styles = StyleSheet.create({
	wrapper: {
		width: '100%',
	},
	plotSection: {
		paddingLeft: CONTENT_LEFT_OFFSET,
		paddingRight: horizontalScreenPadding,
		paddingBottom: 10,
	},
	descriptionSection: {
		paddingLeft: CONTENT_LEFT_OFFSET,
		paddingRight: horizontalScreenPadding,
		paddingBottom: 12,
	},
	description: {
		fontSize: 12,
		lineHeight: 17,
	},
	separator: {
		width: '100%',
		height: StyleSheet.hairlineWidth,
	},
});
