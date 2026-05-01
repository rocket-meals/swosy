import { StyleProp, ImageStyle } from 'react-native';

/**
 * Available avatar styles from @dicebear/collection.
 */
export enum AvatarStyle {
	Adventurer = 'adventurer',
	AdventurerNeutral = 'adventurer-neutral',
	Avataaars = 'avataaars',
	AvataaarsNeutral = 'avataaars-neutral',
	BigEars = 'big-ears',
	BigEarsNeutral = 'big-ears-neutral',
	BigSmile = 'big-smile',
	Bottts = 'bottts',
	BotttsNeutral = 'bottts-neutral',
	Croodles = 'croodles',
	CroodlesNeutral = 'croodles-neutral',
	Dylan = 'dylan',
	FunEmoji = 'fun-emoji',
	Glass = 'glass',
	Icons = 'icons',
	Identicon = 'identicon',
	Initials = 'initials',
	Lorelei = 'lorelei',
	LoreleiNeutral = 'lorelei-neutral',
	Micah = 'micah',
	Miniavs = 'miniavs',
	Notionists = 'notionists',
	NotionistsNeutral = 'notionists-neutral',
	OpenPeeps = 'open-peeps',
	Personas = 'personas',
	PixelArt = 'pixel-art',
	PixelArtNeutral = 'pixel-art-neutral',
	Rings = 'rings',
	Shapes = 'shapes',
	Thumbs = 'thumbs',
	ToonHead = 'toon-head',
}

export interface MyAvatarProps {
	/** Seed string used to generate the avatar deterministically. */
	seed?: string;
	/** Avatar style to use. Defaults to Lorelei. */
	style?: AvatarStyle;
	/** Size in pixels (width and height). Defaults to 128. */
	size?: number;
	/** Optional additional image style overrides. */
	imageStyle?: StyleProp<ImageStyle>;
}
