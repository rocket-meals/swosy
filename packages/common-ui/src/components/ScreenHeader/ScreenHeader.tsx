import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export interface ScreenHeaderProps {
	/** The header title text */
	label: string;
	/** Left-side element, e.g. a back or menu button */
	leftElement?: ReactNode;
	/** Right-side element, e.g. action buttons */
	rightElement?: ReactNode;
	/** Header height in pixels (default: 60) */
	height?: number;
}

const DEFAULT_HEIGHT = 60;

const ScreenHeader: React.FC<ScreenHeaderProps> = ({ label, leftElement, rightElement, height }) => {
	const { theme } = useTheme();
	const resolvedHeight = height ?? DEFAULT_HEIGHT;

	return (
		<View
			style={[
				styles.header,
				{
					height: resolvedHeight,
					backgroundColor: theme.header.background,
				},
			]}
		>
			<View style={styles.row}>
				<View style={styles.left}>
					{leftElement}
					<Text style={[styles.label, { color: theme.header.text }]} numberOfLines={1}>
						{label}
					</Text>
				</View>
				{rightElement ? <View style={styles.right}>{rightElement}</View> : null}
			</View>
		</View>
	);
};

export default ScreenHeader;

const styles = StyleSheet.create({
	header: {
		width: '100%',
		justifyContent: 'center',
		paddingHorizontal: 16,
	},
	row: {
		width: '100%',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	left: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	right: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	label: {
		fontSize: 18,
		fontWeight: '600',
		flexShrink: 1,
	},
});
