import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { AvatarConfig, AvatarSize, AvatarStyle, createAvatarSvg } from './AvatarSvg';

// The SVG generation lives in `./AvatarSvg` (no react-native), so the Directus module of the backend can draw the same avatars.
export { AvatarStyle, AvatarSize, STYLE_MAP, getStyleProbabilityKeys, parseAvatarConfig, createAvatarSvg } from './AvatarSvg';
export type { AvatarConfig } from './AvatarSvg';

/** Avatar preview appearance shared with the avatar-editor picker modals (see MyAvatarEditor). */
export type AvatarAppearanceProps = {
	/** When true (default), uses the avatar size as the border radius to produce a circle. */
	rounded?: boolean;
	/** Background color rendered behind the avatar. */
	backgroundColor?: string;
};

export type MyAvatarProps = AvatarAppearanceProps & {
	/** When provided, all avatar parameters are taken from this config object. */
	config?: AvatarConfig;
	style?: AvatarStyle;
	size?: AvatarSize | number;
	/** Explicit border radius. Ignored when `rounded` is true. */
	borderRadius?: number;
	/** Additional DiceBear options (e.g. eyes, mouth, hair, nose, etc.) */
	options?: Record<string, string[] | boolean | number>;
};

const MyAvatar: React.FC<MyAvatarProps> = ({
	config,
	style: styleProp = AvatarStyle.AVATAAARS,
	size: sizeProp = AvatarSize.LARGE,
	borderRadius = 0,
	rounded = true,
	backgroundColor = '#ffffff',
	options: optionsProp,
}) => {
	const size = config?.size ?? sizeProp;

	const resolvedBorderRadius = rounded ? size : borderRadius;

	const svgXml = useMemo(() => createAvatarSvg({ config, style: styleProp, size: sizeProp, options: optionsProp }), [config, styleProp, sizeProp, optionsProp]);

	// pointerEvents="none": MyAvatar is purely decorative — press handling always lives on a
	// parent (TouchableOpacity/Pressable rows, the QuickStart preset grid, ...). react-native-svg
	// performs its own native hit-testing and can claim/swallow touches before they reach the
	// surrounding touchable (observed on iOS release builds: QuickStart preset tiles — whose whole
	// surface is the SVG — showed no press feedback at all in TestFlight while working in Expo Go).
	// Opting the avatar out of hit-testing lets every touch fall through to the parent touchable.
	return (
		<View pointerEvents="none" style={[styles.container, { width: size, height: size, borderRadius: resolvedBorderRadius, backgroundColor }]}>
			<SvgXml xml={svgXml} width={size} height={size} />
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		overflow: 'hidden',
		alignItems: 'center',
		justifyContent: 'center',
	},
});

export default MyAvatar;
