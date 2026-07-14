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
	AvatarConfig,
	SettingsList,
	SettingsListGroupTitle,
	SettingsListSelectOption,
} from 'repo-depkit-common-ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import { useAvatarProfileEditor, AVATAR_BACKGROUND } from '@/hooks/useAvatarProfileEditor';

const ALL_AVATAR_STYLES = Object.values(AvatarStyle).map((style) => ({
	id: style,
	label: style,
}));

// Debug-only default config used for the size-comparison row below when the user has no avatar yet.
const DEBUG_SIZE_PREVIEW_CONFIG: AvatarConfig = {
	style: AvatarStyle.AVATAAARS,
	size: AvatarSize.LARGE,
};

// Different render sizes to compare on the same screen. Useful for spotting size-dependent
// rendering bugs (e.g. clipping that only shows up at certain pixel sizes on some Android devices).
const DEBUG_PREVIEW_SIZES = [24, AvatarSize.SMALL, AvatarSize.MEDIUM, AvatarSize.LARGE, AvatarSize.XLARGE];

const AvatarsScreen = () => {
	useSetPageTitle(TranslationKeys.avatars);
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const { primaryColor } = useAppSelector((state) => state.settings);
	const debugMode = useDebugMode();
	const { show: showModal, close: closeModal } = useMyScrollViewModal();

	const [selectedStyle, setSelectedStyle] = useState<AvatarStyle>(AvatarStyle.AVATAAARS);

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

				{/*
					Always shown here (unlike the production Settings/Friends screens, where the
					avatar editor entry point is currently commented out because of the Android
					rendering bug), so the editor stays reachable for testing regardless of
					registration status. Saving still no-ops without a logged-in profile.
				*/}
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

				{/*
					Debug row: the same avatar rendered at several sizes side by side. Added to help
					diagnose a bug where avatars render partially cut off on some Android devices
					(e.g. Galaxy S25) but not on web/iOS - useful for checking whether the clipping
					is specific to certain render sizes.
				*/}
				<SettingsListGroupTitle title={`${translate(TranslationKeys.avatars)} - Size Debug`} />
				<View style={styles.sizeDebugRow}>
					{DEBUG_PREVIEW_SIZES.map((size) => {
						// MyAvatar prioritizes `config.size` over the `size` prop, so pass style/options
						// separately here instead of `config` to force each preview to its own size.
						const previewConfig = avatarConfig ?? DEBUG_SIZE_PREVIEW_CONFIG;
						return (
							<View key={size} style={styles.sizeDebugItem}>
								<MyAvatar
									style={previewConfig.style}
									options={previewConfig.options}
									size={size}
									rounded={true}
									backgroundColor={AVATAR_BACKGROUND}
								/>
								<Text style={{ color: theme.screen.text }}>{size}px</Text>
							</View>
						);
					})}
				</View>
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
	sizeDebugRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		alignItems: 'flex-end',
		justifyContent: 'center',
		gap: 16,
		paddingVertical: 16,
	},
	sizeDebugItem: {
		alignItems: 'center',
		gap: 4,
	},
});

export default AvatarsScreen;

