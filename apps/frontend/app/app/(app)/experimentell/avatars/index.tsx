import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { useAppSelector } from '@/redux/hooks';
import useDebugMode from '@/hooks/useDebugMode';
import {
	MyAvatar,
	AvatarStyle,
	AvatarSize,
	SettingsList,
	SettingsListGroupTitle,
	useAvatarEditorModal,
	AvatarConfig,
} from 'repo-depkit-common-ui';

const DEFAULT_CONFIG: AvatarConfig = {
	seed: 'John Doe',
	style: AvatarStyle.LORELEI,
	size: AvatarSize.LARGE,
};

const AvatarsScreen = () => {
	useSetPageTitle(TranslationKeys.avatars);
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const { primaryColor } = useAppSelector((state) => state.settings);
	const debugMode = useDebugMode();
	const { showAvatarEditor } = useAvatarEditorModal();

	const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(DEFAULT_CONFIG);

	const handleOpenEditor = () => {
		showAvatarEditor(avatarConfig, (updatedConfig) => {
			setAvatarConfig(updatedConfig);
		}, {
			title: translate(TranslationKeys.avatars),
			accentColor: primaryColor,
			debugMode,
		});
	};

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
					<MyAvatar
						config={avatarConfig}
						borderRadius={avatarConfig.size / 2}
					/>
				</View>

				<SettingsListGroupTitle title={translate(TranslationKeys.avatars)} />
				<SettingsList
					title={translate(TranslationKeys.avatar_style)}
					value={avatarConfig.style}
					onPress={handleOpenEditor}
					iconBgColor={primaryColor}
					groupPosition="single"
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
