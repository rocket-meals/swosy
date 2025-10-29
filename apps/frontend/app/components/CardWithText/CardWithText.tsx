import React, { memo } from 'react';
import { Image, TouchableOpacity, View, StyleSheet } from 'react-native';
import { CardWithTextProps } from './types';

const CardWithText: React.FC<CardWithTextProps> = ({ imageSource, containerStyle, imageContainerStyle, imageStyle, contentStyle, topRadius = 18, borderColor, imageChildren, children, bottomContent, ...rest }) => {
	const contentBorder = borderColor ? { borderTopColor: borderColor, borderTopWidth: 3 } : undefined;

	return (
		<TouchableOpacity style={[styles.card, { borderTopLeftRadius: topRadius, borderTopRightRadius: topRadius }, containerStyle]} activeOpacity={0.9} {...rest}>
			<View style={[styles.imageContainer, { borderTopLeftRadius: topRadius, borderTopRightRadius: topRadius }, imageContainerStyle]}>
				{imageSource ? <Image style={[styles.image, { borderTopLeftRadius: topRadius, borderTopRightRadius: topRadius }, imageStyle]} source={imageSource} /> : null}
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
		resizeMode: 'cover',
	},
	cardContent: {
		padding: 8,
	},
});
