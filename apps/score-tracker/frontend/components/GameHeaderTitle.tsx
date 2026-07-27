import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'repo-depkit-common-ui';
import GameTypeIcon from './GameTypeIcon';

const HEADER_IMAGE_SIZE = 26;

/**
 * Header title of a game: its picture next to the name. A game shows either a
 * picture or an emoji, never both - so with an image the emoji is gone from the
 * header and the picture takes its place, small enough to sit in the title row.
 *
 * Games without a picture keep the plain `"🎲 Name"` text title (see the
 * screens' `navigation.setOptions`), which needs no component at all.
 */
export default function GameHeaderTitle({
	name,
	icon,
	imageUrl,
}: Readonly<{ name: string; icon: string; imageUrl: string }>) {
	const { theme } = useTheme();
	return (
		<View style={styles.row}>
			{/* `icon` is only the fallback for an image that fails to load - a game
			    that has a picture never shows both. */}
			<GameTypeIcon icon={icon} imageUrl={imageUrl} size={HEADER_IMAGE_SIZE} />
			<Text style={[styles.title, { color: theme.header.text }]} numberOfLines={1}>
				{name}
			</Text>
		</View>
	);
}

/** Header title element for a game, or `undefined` to keep the default text title. */
export function makeGameHeaderTitle(name: string, icon: string, imageUrl: string | null | undefined) {
	if (!imageUrl) return undefined;
	return () => <GameHeaderTitle name={name} icon={icon} imageUrl={imageUrl} />;
}

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	title: {
		fontSize: 18,
		fontWeight: '600',
		flexShrink: 1,
	},
});
