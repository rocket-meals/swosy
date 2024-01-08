import React, {FunctionComponent, useEffect, useState} from "react";
import {Text, View} from "native-base"
import { createAvatar } from '@dicebear/avatars';
import * as adventurer from '@dicebear/adventurer';
import * as adventurerNeutral from '@dicebear/adventurer-neutral';
import * as avataaars from '@dicebear/avatars-avataaars-sprites';
import * as bigEars from '@dicebear/big-ears';
import * as bigEarsNeutral from '@dicebear/big-ears-neutral';
import * as bigSmile from '@dicebear/big-smile';
import * as bottts from '@dicebear/avatars-bottts-sprites';
import * as croodles from '@dicebear/croodles';
import * as croodlesNeutral from '@dicebear/croodles-neutral';
import * as identicon from '@dicebear/avatars-identicon-sprites';
import * as initials from '@dicebear/avatars-initials-sprites';
import * as micah from '@dicebear/micah';
import * as miniavs from '@dicebear/miniavs';
import * as openPeeps from '@dicebear/open-peeps';
import * as personas from '@dicebear/personas';
import * as pixelArt from '@dicebear/pixel-art';
import * as pixelArtNeutral from '@dicebear/pixel-art-neutral';

import Rectangle from "../../helper/Rectangle";
import {ParentDimension} from "../../helper/ParentDimension";
import {AvatarRenderer} from "./AvatarRenderer";


export const getAvatarRawSchema = (style: AvatarStyle) => {
	return getAvatarLib(style).schema;
}

export const getAvatarProperties = (style: AvatarStyle) => {
	let schema = getAvatarRawSchema(style);
	return schema.properties;
}

export const getAvatarPropertiesDict = (style: AvatarStyle) => {
	let properties = getAvatarProperties(style);
	let dict = {};
	let keys = Object.keys(properties);
	for(let key of keys){
		let values = properties[key];
		// @ts-ignore
		dict[key] = values?.title;
	}
	return dict;
}

export const getBotSeeds = () => {

}

export const getAvatarLib = (style: AvatarStyle) => {
	switch (style){
		case AvatarStyle.adventurer: return adventurer;
		case AvatarStyle.adventurerNeutral: return adventurerNeutral;
		case AvatarStyle.avataaars: return avataaars;
		case AvatarStyle.bigEars: return bigEars;
		case AvatarStyle.bigEarsNeutral: return bigEarsNeutral;
		case AvatarStyle.bigSmile: return bigSmile;
		case AvatarStyle.bottts: return bottts;
		case AvatarStyle.croodles: return croodles;
		case AvatarStyle.croodlesNeutral: return croodlesNeutral;
		case AvatarStyle.identicon: return identicon;
		case AvatarStyle.initials: return initials;
		case AvatarStyle.micah: return micah;
		case AvatarStyle.miniavs: return miniavs;
		case AvatarStyle.openPeeps: return openPeeps;
		case AvatarStyle.personas: return personas;
		case AvatarStyle.pixelArt: return pixelArt;
		case AvatarStyle.pixelArtNeutral: return pixelArtNeutral;
	}
	return avataaars;
}

export enum AvatarStyle {
	adventurer = "adventurer",
	adventurerNeutral = "adventurerNeutral",
	avataaars = "avataaars",
	bigEars = "bigEars",
	bigEarsNeutral = "bigEarsNeutral",
	bigSmile = "bigSmile",
	bottts = "bottts", // problem with fixed size? //bots need a seed?
	croodles = "croodles",
	croodlesNeutral = "croodlesNeutral",
	identicon = "identicon",
//	initials = "initials",// keine initialen on mobile?
	micah = "micah",
	miniavs = "miniavs",
	openPeeps = "openPeeps",
	personas = "personas",
	pixelArt = "pixelArt",
	pixelArtNeutral = "pixelArtNeutral"
}

interface AppState {
	avatar: {
		type: AvatarStyle,
		values?: any,
		flip?: boolean
	},
}
export const Avatar: FunctionComponent<AppState> = (props) => {

	const avatarStyle = props.avatar.type;
	const avatarProps = props.avatar.values;

	// corresponding componentDidMount
	useEffect(() => {
	}, [props])

	const [size, setSize] = useState(0);

	// @ts-ignore
	let svg = createAvatar(getAvatarLib(avatarStyle), {
		...avatarProps,
		size: size,
		base64: false,
	});

	return(
		<Rectangle>
			<ParentDimension setDimension={(x, y, width, height) => {
				let smallestDim = width < height ? width : height;
				setSize(smallestDim);
			}} >
				<AvatarRenderer key={svg} svg={svg} />
			</ParentDimension>
		</Rectangle>
	)
}