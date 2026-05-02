import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { useAppSelector } from '@/redux/hooks';
import {
	MyAvatar,
	AvatarStyle,
	AvatarSize,
	SettingsListSelectOption,
	SettingsListGroupTitle,
	SettingsListTextInput,
} from 'repo-depkit-common-ui';

const AVATAR_STYLE_OPTIONS = Object.values(AvatarStyle).map((style) => ({
	id: style,
	label: style,
}));

const AVATAR_SIZE_OPTIONS = [
	{ id: AvatarSize.SMALL, label: `Small (${AvatarSize.SMALL}px)` },
	{ id: AvatarSize.MEDIUM, label: `Medium (${AvatarSize.MEDIUM}px)` },
	{ id: AvatarSize.LARGE, label: `Large (${AvatarSize.LARGE}px)` },
	{ id: AvatarSize.XLARGE, label: `XLarge (${AvatarSize.XLARGE}px)` },
];

const AvatarsScreen = () => {
	useSetPageTitle(TranslationKeys.avatars);
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const { primaryColor } = useAppSelector((state) => state.settings);

	const [selectedStyle, setSelectedStyle] = useState<AvatarStyle>(AvatarStyle.LORELEI);
	const [selectedSize, setSelectedSize] = useState<AvatarSize>(AvatarSize.LARGE);
	const [seed, setSeed] = useState<string>('John Doe');

	return (
		<ScrollView
			style={{ flex: 1, backgroundColor: theme.screen.background }}
			contentContainerStyle={{ backgroundColor: theme.screen.background }}
		>
			<View style={styles.content}>
				<Text style={[styles.heading, { color: theme.screen.text }]}>
					{translate(TranslationKeys.avatars)}
				</Text>

				<View style={styles.avatarContainer}>
					<MyAvatar seed={seed} style={selectedStyle} size={selectedSize} borderRadius={selectedSize / 2} />
				</View>

				<SettingsListGroupTitle label={translate(TranslationKeys.avatar_seed)} />
				<SettingsListTextInput
					label={translate(TranslationKeys.avatar_seed)}
					placeholder={translate(TranslationKeys.avatar_seed)}
					initialValue={seed}
					onSave={setSeed}
					iconBgColor={primaryColor}
					groupPosition="single"
				/>

				<SettingsListGroupTitle label={`${translate(TranslationKeys.avatar_style)} (${selectedStyle})`} />
				<SettingsListSelectOption
					options={AVATAR_STYLE_OPTIONS}
					selectedOption={selectedStyle}
					onSelect={(option) => setSelectedStyle(option.id as AvatarStyle)}
					iconBgColor={primaryColor}
					selectionColor={primaryColor}
				/>

				<SettingsListGroupTitle label={translate(TranslationKeys.avatar_size)} />
				<SettingsListSelectOption
					options={AVATAR_SIZE_OPTIONS}
					selectedOption={selectedSize}
					onSelect={(option) => setSelectedSize(option.id as AvatarSize)}
					iconBgColor={primaryColor}
					selectionColor={primaryColor}
				/>
			</View>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	content: {
		width: '100%',
		padding: 20,
	},
	heading: {
		fontSize: 24,
		fontFamily: 'Poppins_700Bold',
		marginVertical: 10,
	},
	avatarContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 24,
	},
});

export default AvatarsScreen;
