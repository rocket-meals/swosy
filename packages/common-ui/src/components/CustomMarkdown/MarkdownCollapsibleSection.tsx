import React, { useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { myContrastColor } from '../../helpers/ColorHelper';

export type MarkdownCollapsibleSectionProps = {
	headerText: string;
	children: React.ReactNode;
	customColor?: string;
	startCollapsed?: boolean;
};

const ANIMATION_DURATION = 250;

// Deliberately not react-native-collapsible: its async measure() returns 0 on
// react-native-web until the content has been visible once, so the first expand
// animates to an empty section. Content here stays mounted (clipped to height 0
// while collapsed) so onLayout always knows the real height before the first toggle.
const MarkdownCollapsibleSection: React.FC<MarkdownCollapsibleSectionProps> = ({ headerText, children, customColor, startCollapsed = false }) => {
	const [collapsed, setCollapsed] = useState(startCollapsed);
	const [animating, setAnimating] = useState(false);
	const contentHeightRef = useRef(0);
	const animatedHeight = useRef(new Animated.Value(0)).current;
	const { theme, isDark } = useTheme();
	const resolvedColor = customColor || theme.primary;
	const contrastColor = myContrastColor(resolvedColor, theme, isDark);

	const onContentLayout = (event: LayoutChangeEvent) => {
		contentHeightRef.current = event.nativeEvent.layout.height;
	};

	const toggle = () => {
		const nextCollapsed = !collapsed;
		setCollapsed(nextCollapsed);
		if (contentHeightRef.current === 0) {
			return;
		}
		setAnimating(true);
		animatedHeight.setValue(nextCollapsed ? contentHeightRef.current : 0);
		Animated.timing(animatedHeight, {
			toValue: nextCollapsed ? 0 : contentHeightRef.current,
			duration: ANIMATION_DURATION,
			useNativeDriver: false,
		}).start(() => setAnimating(false));
	};

	const contentWrapperStyle = animating ? { height: animatedHeight, overflow: 'hidden' as const } : collapsed ? styles.contentCollapsed : undefined;

	return (
		<View style={[styles.headerContainer, { borderColor: resolvedColor }]}>
			<TouchableOpacity onPress={toggle} accessibilityRole="button" accessibilityState={{ expanded: !collapsed }}>
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
			<Animated.View style={contentWrapperStyle}>
				<View onLayout={onContentLayout}>
					<View style={[styles.content, { backgroundColor: theme.screen.background }]}>{children}</View>
				</View>
			</Animated.View>
		</View>
	);
};

export default MarkdownCollapsibleSection;

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
	contentCollapsed: {
		height: 0,
		overflow: 'hidden',
	},
});
