import React, { useMemo } from 'react';
import { Image, StyleSheet } from 'react-native';
import { AvatarStyle, MyAvatarProps } from './types';

const DICEBEAR_API_BASE = 'https://api.dicebear.com/9.x';

/**
 * MyAvatar renders a DiceBear avatar as a React Native Image.
 * Uses the DiceBear HTTP API with PNG format for full React Native compatibility.
 * The avatar is generated deterministically from the provided seed and style.
 */
const MyAvatar: React.FC<MyAvatarProps> = ({
	seed = 'John Doe',
	style = AvatarStyle.Lorelei,
	size = 128,
	imageStyle,
}) => {
	const avatarUri = useMemo(() => {
		const encodedSeed = encodeURIComponent(seed);
		return `${DICEBEAR_API_BASE}/${style}/png?seed=${encodedSeed}&size=${size}`;
	}, [seed, style, size]);

	return (
		<Image
			source={{ uri: avatarUri }}
			style={[
				styles.avatar,
				{ width: size, height: size, borderRadius: size / 2 },
				imageStyle,
			]}
		/>
	);
};

const styles = StyleSheet.create({
	avatar: {
		resizeMode: 'contain',
	},
});

export default MyAvatar;
