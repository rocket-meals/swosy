import React, { memo, useCallback, useMemo, useState } from 'react';
import {
	Image,
	ImageSourcePropType,
	ImageStyle,
	LayoutChangeEvent,
	StyleProp,
	StyleSheet,
	TouchableOpacity,
	TouchableOpacityProps,
	View,
	ViewStyle,
} from 'react-native';

export interface CardWithTextProps extends TouchableOpacityProps {
	/**
	 * Optional image source for the upper section. When omitted the
	 * imageChildren prop can be used to render custom content (e.g. a map or QR code).
	 */
	imageSource?: ImageSourcePropType;
	containerStyle?: StyleProp<ViewStyle>;
	imageContainerStyle?: StyleProp<ViewStyle>;
	imageStyle?: StyleProp<ImageStyle>;
	contentStyle?: StyleProp<ViewStyle>;
	/**
	 * Optional top border radius for the card image area. Defaults to 0.
	 */
	topRadius?: number;
	/**
	 * Optional border color for the content section. If provided a 3 px
	 * divider is rendered between the image and the text area.
	 */
	borderColor?: string;
	/** Custom content rendered inside the image area (e.g. a map preview). */
	imageChildren?: React.ReactNode;
	/**
	 * Alternative content for the bottom section of the card. When provided it
	 * takes precedence over the regular children prop.
	 */
	bottomContent?: React.ReactNode;
	children?: React.ReactNode;
	/**
	 * When the card width is already known (e.g. computed from screen width),
	 * supply it here to skip the onLayout measurement pass.
	 */
	knownCardWidth?: number;
	/**
	 * Aspect ratio of the image area. Defaults to 1 (square).
	 * Pass `false` to omit the aspect-ratio constraint entirely.
	 */
	aspectRatio?: number | boolean;
	/**
	 * Optional custom image renderer. Receives the image source, computed style
	 * and the accessibility label for the image (if provided).
	 * Use this to render with a caching image component (e.g. expo-image).
	 * When omitted, the default React Native Image is used.
	 */
	renderImage?: (source: ImageSourcePropType, style: StyleProp<ImageStyle>, imageAccessibilityLabel?: string) => React.ReactNode;
	/**
	 * Accessible description of the card image (e.g. the food or building name).
	 * Forwarded to the image so screen readers get an alt text on web.
	 */
	imageAccessibilityLabel?: string;
}

/**
 * Resolve the effective image aspect ratio from the `aspectRatio` prop:
 * `false` disables it (undefined), a number is used as-is, and `true` (or
 * omitted) falls back to a square (1) aspect ratio.
 */
function resolveAspectRatio(aspectRatio: number | boolean): number | undefined {
	if (aspectRatio === false) {
		return undefined;
	}
	if (typeof aspectRatio === 'number') {
		return aspectRatio;
	}
	return 1;
}

const CardWithText: React.FC<CardWithTextProps> = ({
	imageSource,
	containerStyle,
	imageContainerStyle,
	imageStyle,
	contentStyle,
	topRadius = 0,
	borderColor,
	imageChildren,
	children,
	bottomContent,
	knownCardWidth,
	aspectRatio = 1,
	renderImage,
	imageAccessibilityLabel,
	...rest
}) => {
	const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);

	const widthToUse = knownCardWidth ?? measuredWidth;

	const captionMinHeight = useMemo(() => {
		if (!widthToUse) return 84;
		const computed = Math.round(widthToUse * 0.22);
		return Math.max(64, Math.min(130, computed));
	}, [widthToUse]);

	const onLayoutCard = useCallback(
		(e: LayoutChangeEvent) => {
			if (knownCardWidth) return;
			const w = Math.round(e.nativeEvent.layout.width);
			if (w && w !== measuredWidth) {
				setMeasuredWidth(w);
			}
		},
		[knownCardWidth, measuredWidth],
	);

	const resolvedImageContainerStyle: StyleProp<ViewStyle>[] = Array.isArray(imageContainerStyle)
		? [styles.imageContainer, ...(imageContainerStyle as StyleProp<ViewStyle>[])]
		: [styles.imageContainer, imageContainerStyle as StyleProp<ViewStyle>];

	const resolvedAspectRatio = resolveAspectRatio(aspectRatio);

	let imageContent: React.ReactNode = null;
	if (imageSource) {
		imageContent = renderImage
			? renderImage(imageSource, [styles.image, imageStyle], imageAccessibilityLabel)
			: <Image source={imageSource} style={[styles.image, imageStyle]} resizeMode="cover" accessible={!!imageAccessibilityLabel} accessibilityLabel={imageAccessibilityLabel} />;
	}

	return (
		<TouchableOpacity
			activeOpacity={0.9}
			style={[styles.card, containerStyle]}
			onLayout={onLayoutCard}
			{...rest}
		>
			<View
				style={[
					styles.squareWrapper,
					{ borderTopLeftRadius: topRadius, borderTopRightRadius: topRadius },
					{ aspectRatio: resolvedAspectRatio },
				]}
			>
				<View style={[{ borderTopLeftRadius: topRadius, borderTopRightRadius: topRadius }, ...resolvedImageContainerStyle]}>
					{imageContent}
					{imageChildren}
				</View>
			</View>

			{borderColor ? <View style={[styles.divider, { backgroundColor: borderColor }]} /> : null}

			<View
				style={[
					styles.cardContent,
					{
						minHeight: captionMinHeight,
						paddingHorizontal: Math.round((widthToUse ?? 360) * 0.05),
					},
					contentStyle,
				]}
			>
				{bottomContent ?? children}
			</View>
		</TouchableOpacity>
	);
};

export default memo(CardWithText);

const styles = StyleSheet.create({
	card: {
		overflow: 'hidden',
		borderRadius: 12,
	},
	squareWrapper: {
		width: '100%',
		overflow: 'hidden',
		position: 'relative',
	},
	imageContainer: {
		width: '100%',
		height: '100%',
		overflow: 'hidden',
		position: 'relative',
	},
	image: {
		width: '100%',
		height: '100%',
	},
	divider: {
		width: '100%',
		height: 3,
	},
	cardContent: {
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'transparent',
	},
});
