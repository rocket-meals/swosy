import React, { useMemo } from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { createAvatar, Style } from '@dicebear/core';
import * as collection from '@dicebear/collection';
import { AvatarStyle, MyAvatarProps } from './types';

/**
 * Maps each AvatarStyle enum value to its corresponding @dicebear/collection style object.
 */
const AVATAR_STYLE_MAP: Record<AvatarStyle, Style<object>> = {
	[AvatarStyle.Adventurer]: collection.adventurer as Style<object>,
	[AvatarStyle.AdventurerNeutral]: collection.adventurerNeutral as Style<object>,
	[AvatarStyle.Avataaars]: collection.avataaars as Style<object>,
	[AvatarStyle.AvataaarsNeutral]: collection.avataaarsNeutral as Style<object>,
	[AvatarStyle.BigEars]: collection.bigEars as Style<object>,
	[AvatarStyle.BigEarsNeutral]: collection.bigEarsNeutral as Style<object>,
	[AvatarStyle.BigSmile]: collection.bigSmile as Style<object>,
	[AvatarStyle.Bottts]: collection.bottts as Style<object>,
	[AvatarStyle.BotttsNeutral]: collection.botttsNeutral as Style<object>,
	[AvatarStyle.Croodles]: collection.croodles as Style<object>,
	[AvatarStyle.CroodlesNeutral]: collection.croodlesNeutral as Style<object>,
	[AvatarStyle.Dylan]: collection.dylan as Style<object>,
	[AvatarStyle.FunEmoji]: collection.funEmoji as Style<object>,
	[AvatarStyle.Glass]: collection.glass as Style<object>,
	[AvatarStyle.Icons]: collection.icons as Style<object>,
	[AvatarStyle.Identicon]: collection.identicon as Style<object>,
	[AvatarStyle.Initials]: collection.initials as Style<object>,
	[AvatarStyle.Lorelei]: collection.lorelei as Style<object>,
	[AvatarStyle.LoreleiNeutral]: collection.loreleiNeutral as Style<object>,
	[AvatarStyle.Micah]: collection.micah as Style<object>,
	[AvatarStyle.Miniavs]: collection.miniavs as Style<object>,
	[AvatarStyle.Notionists]: collection.notionists as Style<object>,
	[AvatarStyle.NotionistsNeutral]: collection.notionistsNeutral as Style<object>,
	[AvatarStyle.OpenPeeps]: collection.openPeeps as Style<object>,
	[AvatarStyle.Personas]: collection.personas as Style<object>,
	[AvatarStyle.PixelArt]: collection.pixelArt as Style<object>,
	[AvatarStyle.PixelArtNeutral]: collection.pixelArtNeutral as Style<object>,
	[AvatarStyle.Rings]: collection.rings as Style<object>,
	[AvatarStyle.Shapes]: collection.shapes as Style<object>,
	[AvatarStyle.Thumbs]: collection.thumbs as Style<object>,
	[AvatarStyle.ToonHead]: collection.toonHead as Style<object>,
};

/**
 * MyAvatar renders a DiceBear avatar as an inline SVG via react-native-svg.
 * The avatar is generated deterministically from the provided seed and style.
 */
const MyAvatar: React.FC<MyAvatarProps> = ({
	seed = 'John Doe',
	style = AvatarStyle.Lorelei,
	size = 128,
	containerStyle,
}) => {
	const svgString = useMemo(() => {
		const dicebearStyle = AVATAR_STYLE_MAP[style];
		return createAvatar(dicebearStyle, {
			seed,
			size,
		}).toString();
	}, [seed, style, size]);

	return (
		<View style={[{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }, containerStyle]}>
			<SvgXml xml={svgString} width={size} height={size} />
		</View>
	);
};

export default MyAvatar;
