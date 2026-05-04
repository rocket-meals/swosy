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
import { MaterialCommunityIcons } from '@expo/vector-icons';

const AvatarsScreen = () => {
	useSetPageTitle(TranslationKeys.avatars);
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const { primaryColor } = useAppSelector((state) => state.settings);
	const debugMode = useDebugMode();
	const { showAvatarEditor, showAvatarEditorQuickStart } = useAvatarEditorModal();

	const [avatarConfig, setAvatarConfig] = useState<AvatarConfig | null>(null);

	const editorOptions = {
		title: translate(TranslationKeys.avatars),
		accentColor: primaryColor,
		debugMode,
		allowedStyles: [AvatarStyle.OPEN_PEEPS],
	};

	const handleEdit = () => {
		if (!avatarConfig) return;
		showAvatarEditor(avatarConfig, (updatedConfig) => {
			setAvatarConfig(updatedConfig);
		}, editorOptions);
	};

	const handleCreateNew = () => {
		showAvatarEditorQuickStart((newConfig) => {
			setAvatarConfig(newConfig);
		}, editorOptions);
	};

	const handleDelete = () => {
		setAvatarConfig(null);
	};

	const handleSave = () => {
		// TODO: Persist the avatar config
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
					{avatarConfig ? (
						<MyAvatar
							config={avatarConfig}
							borderRadius={avatarConfig.size / 2}
						/>
					) : (
						<View style={[styles.placeholderAvatar, { borderColor: theme.screen.text + '33' }]}>
							<MaterialCommunityIcons name="account-outline" size={64} color={theme.screen.text + '66'} />
						</View>
					)}
				</View>

				<SettingsListGroupTitle title={translate(TranslationKeys.avatars)} />
				{avatarConfig && (
					<>
						<SettingsList
							title="Save"
							onPress={handleSave}
							leftIcon={<MaterialCommunityIcons name="content-save" size={20} />}
							iconBgColor={primaryColor}
							groupPosition="top"
							showSeparator={true}
						/>
						<SettingsList
							title="Edit"
							onPress={handleEdit}
							leftIcon={<MaterialCommunityIcons name="pencil" size={20} />}
							iconBgColor={primaryColor}
							groupPosition="middle"
							showSeparator={true}
						/>
						<SettingsList
							title="Delete"
							onPress={handleDelete}
							leftIcon={<MaterialCommunityIcons name="delete" size={20} />}
							iconBgColor={primaryColor}
							groupPosition="middle"
							showSeparator={true}
						/>
					</>
				)}
				<SettingsList
					title="Create New"
					onPress={handleCreateNew}
					leftIcon={<MaterialCommunityIcons name="plus-circle" size={20} />}
					iconBgColor={primaryColor}
					groupPosition={avatarConfig ? 'bottom' : 'single'}
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
	placeholderAvatar: {
		width: AvatarSize.LARGE,
		height: AvatarSize.LARGE,
		borderRadius: AvatarSize.LARGE / 2,
		borderWidth: 2,
		borderStyle: 'dashed',
		alignItems: 'center',
		justifyContent: 'center',
	},
});

export default AvatarsScreen;
