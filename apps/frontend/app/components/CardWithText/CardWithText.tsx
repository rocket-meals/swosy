import React, { memo } from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Image as ExpoImage, ImageProps as ExpoImageProps } from 'expo-image';
import { CardWithTextProps } from './types';

type AnyImageProps = ExpoImageProps & { [k: string]: any };

const DEFAULT_IMAGE_PROPS: AnyImageProps = {
	contentFit: 'cover',
	cachePolicy: 'memory-disk',
	transition: 250,
};

const CardWithText: React.FC<CardWithTextProps & { imageProps?: AnyImageProps }> = ({ imageSource, containerStyle, imageContainerStyle, imageStyle, contentStyle, topRadius = 18, borderColor, imageChildren, children, bottomContent, imageProps, ...rest }) => {
	const contentBorder = borderColor ? { borderTopColor: borderColor, borderTopWidth: 3 } : undefined;

	const forwardedImageProps: AnyImageProps = {
		...DEFAULT_IMAGE_PROPS,
		...(imageProps || {}),
	};

	return (
		<TouchableOpacity style={[styles.card, { borderTopLeftRadius: topRadius, borderTopRightRadius: topRadius }, containerStyle]} activeOpacity={0.9} {...rest}>
			<View style={[styles.imageContainer, { borderTopLeftRadius: topRadius, borderTopRightRadius: topRadius }, imageContainerStyle]}>
				{imageSource ? <ExpoImage {...forwardedImageProps} source={imageSource as any} style={[styles.image, { borderTopLeftRadius: topRadius, borderTopRightRadius: topRadius }, imageStyle]} /> : null}
				{imageChildren}
			</View>

			<View style={[styles.cardContent, contentBorder, contentStyle]}>{bottomContent ?? children}</View>
		</TouchableOpacity>
	);
};

export default memo(CardWithText);

const styles = StyleSheet.create({
	card: {
		overflow: 'hidden',
		borderRadius: 12,
	},
	imageContainer: {
		overflow: 'hidden',
	},
	image: {
		width: '100%',
		height: '100%',
	},
	cardContent: {
		padding: 8,
	},
});
