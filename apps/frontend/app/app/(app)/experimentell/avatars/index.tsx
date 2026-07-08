import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
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
	SettingsListSelectOption,
} from 'repo-depkit-common-ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import { useAvatarProfileEditor, AVATAR_BACKGROUND } from '@/hooks/useAvatarProfileEditor';
import { UserHelper } from '@/helper/UserHelper';

const ALL_AVATAR_STYLES = Object.values(AvatarStyle).map((style) => ({
	id: style,
	label: style,
}));

const AvatarsScreen = () => {
	useSetPageTitle(TranslationKeys.avatars);
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const { primaryColor } = useAppSelector((state) => state.settings);
	const { user } = useAppSelector((state) => state.authReducer);
	const debugMode = useDebugMode();
	const isRegisteredUser = UserHelper.isRegisteredUser(user);
	const { show: showModal, close: closeModal } = useMyScrollViewModal();

	const [selectedStyle, setSelectedStyle] = useState<AvatarStyle>(AvatarStyle.MICAH);

	const { avatarConfig, openEditor, deleteAvatar } = useAvatarProfileEditor();

	const openActionsModal = () => {
		showModal({
			title: translate(TranslationKeys.avatars),
			children: (
				<View style={styles.modalContent}>
					{avatarConfig && (
						<>
							<SettingsList
								title={translate(TranslationKeys.edit)}
								onPress={() => {
									closeModal();
									openEditor(false);
								}}
								leftIcon={<MaterialCommunityIcons name="pencil" size={20} />}
								iconBgColor={primaryColor}
								groupPosition="top"
								showSeparator={true}
							/>
							<SettingsList
								title={translate(TranslationKeys.delete)}
								onPress={() => {
									closeModal();
									void deleteAvatar();
								}}
								leftIcon={<MaterialCommunityIcons name="delete" size={20} />}
								iconBgColor="#F44336"
								groupPosition="middle"
								showSeparator={true}
							/>
						</>
					)}
					<SettingsList
						title={translate(TranslationKeys.avatar_create_new)}
						onPress={() => {
							closeModal();
							openEditor(true);
						}}
						leftIcon={<MaterialCommunityIcons name="plus-circle" size={20} />}
						iconBgColor={primaryColor}
						groupPosition={avatarConfig ? 'bottom' : 'single'}
					/>
				</View>
			),
		});
	};

	return (
		<ScrollView
			style={{ flex: 1, backgroundColor: theme.screen.background }}
			contentContainerStyle={{ backgroundColor: theme.screen.background }}
		>
			<View style={styles.content}>
				<View style={styles.avatarContainer}>
					{avatarConfig ? (
						<MyAvatar
							config={avatarConfig}
							rounded={true}
							backgroundColor={AVATAR_BACKGROUND}
						/>
					) : (
						<View style={[styles.placeholderAvatar, { borderColor: theme.screen.text + '33' }]}>
							<MaterialCommunityIcons name="account-outline" size={64} color={theme.screen.text + '66'} />
						</View>
					)}
				</View>

				{debugMode && (
					<>
						<SettingsListGroupTitle title={translate(TranslationKeys.avatar_style)} />
						<SettingsListSelectOption
							options={ALL_AVATAR_STYLES}
							selectedOption={selectedStyle}
							onSelect={(option) => setSelectedStyle(option.id)}
							iconBgColor={primaryColor}
							selectionColor={primaryColor}
						/>
					</>
				)}

				{isRegisteredUser && (
					<>
						<SettingsListGroupTitle title={translate(TranslationKeys.avatars)} />
						<SettingsList
							title={avatarConfig ? translate(TranslationKeys.edit) : translate(TranslationKeys.avatar_create_new)}
							onPress={openActionsModal}
							leftIcon={
								avatarConfig ? (
									<MaterialCommunityIcons name="pencil" size={20} />
								) : (
									<MaterialCommunityIcons name="plus-circle" size={20} />
								)
							}
							iconBgColor={primaryColor}
							groupPosition="single"
							rightElement={<MaterialCommunityIcons name="chevron-right" size={20} color={theme.screen.icon} />}
						/>
					</>
				)}
			</View>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	content: {
		width: '100%',
		padding: 20,
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
	modalContent: {
		paddingVertical: 8,
	},
});

export default AvatarsScreen;

