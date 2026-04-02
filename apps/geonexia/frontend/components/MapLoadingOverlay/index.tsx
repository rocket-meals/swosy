import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('screen');

// Sky colours – layered to simulate depth (space → atmosphere → earth)
const SKY_DEEP = '#0D1F35';
const SKY_ATMOSPHERE = 'rgba(25, 82, 148, 0.55)';
const EARTH_GLOW = 'rgba(40, 110, 60, 0.22)';

interface CloudLayerProps {
	fontSize: number;
	left: number;   // 0..1 fraction of screen width
	startFraction: number; // 0 = bottom, 1 = top (initial position within the screen)
	duration: number;     // ms for one full bottom → top pass
	opacity: number;
}

function CloudLayer({ fontSize, left, startFraction, duration, opacity }: CloudLayerProps) {
	const endY = -(fontSize + 40);
	const startY = SCREEN_HEIGHT + fontSize;
	// Initial position: somewhere within the screen based on startFraction
	const initialY = startY - startFraction * (startY - endY);
	// Duration for first pass (proportional so speed is constant)
	const firstDuration = Math.round(duration * (1 - startFraction));

	const translateY = useRef(new Animated.Value(initialY)).current;

	useEffect(() => {
		const loopFromBottom = () => {
			translateY.setValue(startY);
			Animated.timing(translateY, {
				toValue: endY,
				duration,
				useNativeDriver: true,
			}).start(({ finished }) => {
				if (finished) loopFromBottom();
			});
		};

		// First pass: start from the initial scattered position
		Animated.timing(translateY, {
			toValue: endY,
			duration: firstDuration,
			useNativeDriver: true,
		}).start(({ finished }) => {
			if (finished) loopFromBottom();
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<Animated.Text
			style={[
				styles.cloud,
				{
					fontSize,
					left: SCREEN_WIDTH * left,
					opacity,
					transform: [{ translateY }],
				},
			]}
		>
			☁️
		</Animated.Text>
	);
}

export function MapLoadingOverlay() {
	const pinScale = useRef(new Animated.Value(1)).current;
	const pinOpacity = useRef(new Animated.Value(0.7)).current;

	useEffect(() => {
		Animated.loop(
			Animated.sequence([
				Animated.parallel([
					Animated.timing(pinScale, { toValue: 1.3, duration: 900, useNativeDriver: true }),
					Animated.timing(pinOpacity, { toValue: 1, duration: 900, useNativeDriver: true }),
				]),
				Animated.parallel([
					Animated.timing(pinScale, { toValue: 1, duration: 900, useNativeDriver: true }),
					Animated.timing(pinOpacity, { toValue: 0.7, duration: 900, useNativeDriver: true }),
				]),
			])
		).start();
	}, [pinScale, pinOpacity]);

	return (
		<View style={styles.container}>
			{/* Layered sky background */}
			<View style={[StyleSheet.absoluteFill, { backgroundColor: SKY_DEEP }]} />
			<View style={[StyleSheet.absoluteFill, styles.atmosphericLayer, { backgroundColor: SKY_ATMOSPHERE }]} />
			<View style={[StyleSheet.absoluteFill, styles.earthLayer, { backgroundColor: EARTH_GLOW }]} />

			{/* Animated cloud layers – drifting upward to simulate descent */}
			<CloudLayer fontSize={72} left={0.04}  startFraction={0.85} duration={7200} opacity={0.90} />
			<CloudLayer fontSize={96} left={0.38}  startFraction={0.55} duration={9000} opacity={0.80} />
			<CloudLayer fontSize={56} left={0.66}  startFraction={0.70} duration={6000} opacity={0.85} />
			<CloudLayer fontSize={80} left={0.18}  startFraction={0.30} duration={8000} opacity={0.75} />
			<CloudLayer fontSize={64} left={0.55}  startFraction={0.10} duration={6800} opacity={0.70} />
			<CloudLayer fontSize={48} left={0.80}  startFraction={0.45} duration={5500} opacity={0.65} />

			{/* Center content */}
			<View style={styles.centerContent} pointerEvents="none">
				<Animated.Text
					style={[styles.pin, { transform: [{ scale: pinScale }], opacity: pinOpacity }]}
				>
					📍
				</Animated.Text>
				<Text style={styles.loadingText}>Preparing map…</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		overflow: 'hidden',
	},
	atmosphericLayer: {
		top: '25%',
	},
	earthLayer: {
		top: '72%',
	},
	cloud: {
		position: 'absolute',
	},
	centerContent: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	pin: {
		fontSize: 52,
		marginBottom: 14,
	},
	loadingText: {
		color: 'rgba(220, 235, 255, 0.85)',
		fontSize: 15,
		fontWeight: '500',
		letterSpacing: 0.8,
	},
});
