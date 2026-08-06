import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { myContrastColor } from '../../helpers/ColorHelper';
import CollapsibleView from './CollapsibleView';

export type CollapsibleSectionProps = {
	headerText: string;
	children: React.ReactNode;
	customColor?: string;
	startCollapsed?: boolean;
};

/**
 * Accordion section with the shared header look (colored icon block + title),
 * used by CustomMarkdown's collapsibleSections mode and the monitor screens.
 * For legal/accessibility-sensitive content (privacy policy, imprint, wikis)
 * keep startCollapsed=false so the content is readable without interaction.
 */
const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ headerText, children, customColor, startCollapsed = false }) => {
	const [collapsed, setCollapsed] = useState(startCollapsed);
	const { theme, isDark } = useTheme();
	const resolvedColor = customColor || theme.primary;
	const contrastColor = myContrastColor(resolvedColor, theme, isDark);

	return (
		<View style={[styles.headerContainer, { borderColor: resolvedColor }]}>
			<TouchableOpacity onPress={() => setCollapsed((prev) => !prev)} accessibilityRole="button" accessibilityState={{ expanded: !collapsed }}>
				<View
					style={[
						styles.header,
						{
							borderBottomLeftRadius: collapsed ? 12 : 5,
							borderBottomRightRadius: collapsed ? 12 : 5,
							backgroundColor: collapsed ? 'transparent' : resolvedColor,
						},
					]}
				>
					<View style={[styles.iconText, { backgroundColor: resolvedColor }]}>
						<MaterialIcons name={collapsed ? 'keyboard-arrow-down' : 'keyboard-arrow-up'} size={22} color={contrastColor} style={styles.icon} />
					</View>
					<View style={styles.headerTextContainer}>
						<Text style={[styles.headerText, { color: collapsed ? theme.screen.text : contrastColor }]}>{headerText}</Text>
					</View>
				</View>
			</TouchableOpacity>
			<CollapsibleView collapsed={collapsed}>
				<View style={[styles.content, { backgroundColor: theme.screen.background }]}>{children}</View>
			</CollapsibleView>
		</View>
	);
};

export default CollapsibleSection;

const styles = StyleSheet.create({
	headerContainer: {
		marginBottom: 20,
		borderWidth: 1,
		borderRadius: 12,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 12,
	},
	iconText: {
		paddingVertical: 25,
		paddingHorizontal: 20,
		borderTopLeftRadius: 10,
		borderBottomLeftRadius: 10,
	},
	icon: {
		alignSelf: 'center',
	},
	headerTextContainer: {
		marginLeft: 10,
		width: '70%',
	},
	headerText: {
		fontSize: 16,
		fontWeight: '500',
	},
	content: {
		paddingHorizontal: 8,
		paddingVertical: 20,
		borderBottomLeftRadius: 12,
		borderBottomRightRadius: 12,
	},
});
