import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

/**
 * Emoji "image" of a game type rendered in a white circle, mirroring the
 * avatar previews used for players/friends.
 */
export default function GameTypeIcon({ icon, size }: Readonly<{ icon: string; size: number }>) {
	return (
		<View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
			<Text style={{ fontSize: size * 0.55, lineHeight: size * 0.75 }}>{icon}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	circle: {
		backgroundColor: '#ffffff',
		justifyContent: 'center',
		alignItems: 'center',
	},
});
