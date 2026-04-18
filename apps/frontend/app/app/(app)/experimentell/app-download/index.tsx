import React from 'react';
import {ScrollView, View, StyleSheet} from 'react-native';
import {useAppSelector} from '@/redux/hooks';
import {useTheme} from '@/hooks/useTheme';
import {TranslationKeys} from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import {CommonSystemActionHelper} from '@/helper/SystemActionHelper';
import SettingsList from '@/components/SettingsList';
import {MaterialCommunityIcons} from '@expo/vector-icons';

const AppDownloadSelection = () => {
	useSetPageTitle(TranslationKeys.app_download_selection);
	const { theme } = useTheme();
	const { appSettings, primaryColor } = useAppSelector((state) => state.settings);

	const handleOpenAppleStore = () => {
		if (appSettings?.app_stores_url_to_apple) {
			CommonSystemActionHelper.openExternalURL(appSettings.app_stores_url_to_apple, true);
		}
	};

	const handleOpenGooglePlay = () => {
		if (appSettings?.app_stores_url_to_google) {
			CommonSystemActionHelper.openExternalURL(appSettings.app_stores_url_to_google, true);
		}
	};

	return (
		<ScrollView
			style={[styles.container, { backgroundColor: theme.screen.background }]}
			contentContainerStyle={[styles.contentContainer, { backgroundColor: theme.screen.background }]}
		>
			<View style={styles.content}>
				<SettingsList
					iconBgColor={primaryColor}
					leftIcon={<MaterialCommunityIcons name="apple" size={24} color={theme.screen.icon} />}
					label="iOS"
					rightIcon={<MaterialCommunityIcons name="open-in-new" size={24} color={theme.screen.icon} />}
					onPress={handleOpenAppleStore}
					groupPosition="top"
				/>
				<SettingsList
					iconBgColor={primaryColor}
					leftIcon={<MaterialCommunityIcons name="android" size={24} color={theme.screen.icon} />}
					label="Android"
					rightIcon={<MaterialCommunityIcons name="open-in-new" size={24} color={theme.screen.icon} />}
					onPress={handleOpenGooglePlay}
					groupPosition="bottom"
				/>
			</View>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	contentContainer: {},
	content: {
		width: '100%',
		padding: 20,
	},
});

export default AppDownloadSelection;
