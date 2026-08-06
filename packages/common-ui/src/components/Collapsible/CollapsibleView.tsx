import React, { useEffect, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, StyleSheet, View } from 'react-native';

export type CollapsibleViewProps = {
	/** Controlled: true hides the content, false shows it (animated). */
	collapsed: boolean;
	children: React.ReactNode;
	animationDuration?: number;
};

// Expand/collapse primitive without react-native-collapsible: that library
// measures content asynchronously and on react-native-web the measurement
// returns 0 until the content has been visible once, so the first expand
// animated to an empty view. Content here stays mounted (clipped to height 0
// while collapsed) so onLayout always knows the real height before the first
// toggle. Purely look-agnostic - headers/styling live in the callers (e.g.
// CollapsibleSection, LicenseInformation).
const CollapsibleView: React.FC<CollapsibleViewProps> = ({ collapsed, children, animationDuration = 250 }) => {
	const [animating, setAnimating] = useState(false);
	const contentHeightRef = useRef(0);
	const animatedHeight = useRef(new Animated.Value(0)).current;
	const prevCollapsedRef = useRef(collapsed);

	useEffect(() => {
		if (prevCollapsedRef.current === collapsed) {
			return;
		}
		prevCollapsedRef.current = collapsed;
		if (contentHeightRef.current === 0) {
			return;
		}
		setAnimating(true);
		animatedHeight.setValue(collapsed ? contentHeightRef.current : 0);
		Animated.timing(animatedHeight, {
			toValue: collapsed ? 0 : contentHeightRef.current,
			duration: animationDuration,
			useNativeDriver: false,
		}).start(() => setAnimating(false));
	}, [collapsed, animatedHeight, animationDuration]);

	const onContentLayout = (event: LayoutChangeEvent) => {
		contentHeightRef.current = event.nativeEvent.layout.height;
	};

	const wrapperStyle = animating ? { height: animatedHeight, overflow: 'hidden' as const } : collapsed ? styles.collapsed : undefined;

	return (
		<Animated.View
			style={wrapperStyle}
			pointerEvents={collapsed ? 'none' : 'auto'}
			accessibilityElementsHidden={collapsed}
			importantForAccessibility={collapsed ? 'no-hide-descendants' : 'auto'}
		>
			<View onLayout={onContentLayout}>{children}</View>
		</Animated.View>
	);
};

export default CollapsibleView;

const styles = StyleSheet.create({
	collapsed: {
		height: 0,
		overflow: 'hidden',
	},
});
