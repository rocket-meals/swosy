import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

/**
 * The "image" of a game, rendered in a white circle mirroring the avatar
 * previews used for players/friends: the game's picture when it has one (only
 * its URL is stored, see helpers/ImageSearch), otherwise its emoji.
 *
 * A URL that fails to load (moved, offline, hotlink-blocked) falls back to the
 * emoji rather than leaving a hole in the list.
 */
export default function GameTypeIcon({
	icon,
	imageUrl,
	size,
}: Readonly<{ icon: string; imageUrl?: string | null; size: number }>) {
	const [failed, setFailed] = useState(false);

	// A new URL deserves a new attempt - otherwise picking a different image
	// after a broken one would stay stuck on the emoji fallback.
	useEffect(() => setFailed(false), [imageUrl]);

	const circleStyle = [styles.circle, { width: size, height: size, borderRadius: size / 2 }];

	if (imageUrl && !failed) {
		return (
			<View style={circleStyle}>
				<Image
					source={{ uri: imageUrl }}
					style={{ width: size, height: size }}
					resizeMode="cover"
					onError={() => setFailed(true)}
				/>
			</View>
		);
	}

	return (
		<View style={circleStyle}>
			<Text style={{ fontSize: size * 0.55, lineHeight: size * 0.75 }}>{icon}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	circle: {
		backgroundColor: '#ffffff',
		justifyContent: 'center',
		alignItems: 'center',
		overflow: 'hidden',
	},
});
