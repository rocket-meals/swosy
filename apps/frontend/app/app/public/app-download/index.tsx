import React from 'react';
import {Image, ScrollView, StyleSheet, View} from 'react-native';
import {useAppSelector} from '@/redux/hooks';
import {useTheme} from '@/hooks/useTheme';
import {TranslationKeys} from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import {getImageUrl} from '@/constants/HelperFunctions';
import {CommonSystemActionHelper} from '@/helper/SystemActionHelper';
import DownloadItem from '@/components/DownloadItem';
import appleStoreIcon from '@/assets/icons/apple-store.png';
import googlePlayIcon from '@/assets/icons/google-play.png';
import {getAppIconInsideExpoLocalSaved} from '@/config';
import {useLocalSearchParams} from 'expo-router';
import {useLanguage} from '@/hooks/useLanguage';
import CustomStackHeader from '@/components/CustomStackHeader/CustomStackHeader';
import {isFullscreenParam} from '@/helper/publicRoutes';

const AppDownloadSelection = () => {
	useSetPageTitle(TranslationKeys.app_download_selection);
	const {theme} = useTheme();
	const {translate} = useLanguage();
	// `?fullscreen=true` hides the header - the QR code on the app download management screen links here that way.
	const {fullscreen} = useLocalSearchParams();
	const isFullscreen = isFullscreenParam(fullscreen);
	const {serverInfo, appSettings} = useAppSelector((state) => state.settings);

	const projectLogo = serverInfo?.info?.project?.project_logo && getImageUrl(serverInfo.info.project.project_logo);

	const iconSource = projectLogo ? {uri: projectLogo} : getAppIconInsideExpoLocalSaved();

	const iosUrl = appSettings?.app_stores_url_to_apple;
	const androidUrl = appSettings?.app_stores_url_to_google;

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
		<View style={[styles.container, {backgroundColor: theme.screen.background}]}>
			{!isFullscreen && <CustomStackHeader label={translate(TranslationKeys.app_download_selection)} />}
			<ScrollView
				style={[styles.container, {backgroundColor: theme.screen.background}]}
				contentContainerStyle={[styles.contentContainer, {backgroundColor: theme.screen.background}]}
			>
				<View style={styles.content}>
					<Image source={iconSource} style={styles.icon} />
					<View style={styles.itemsContainer}>
						<DownloadItem label="iOS" qrValue={iosUrl} imageSource={appleStoreIcon} onPress={handleOpenAppleStore} showExternalLinkIcon />
						<DownloadItem label="Android" qrValue={androidUrl} imageSource={googlePlayIcon} onPress={handleOpenGooglePlay} showExternalLinkIcon />
					</View>
				</View>
			</ScrollView>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	contentContainer: {},
	content: {
		width: '100%',
		height: '100%',
		paddingVertical: 20,
		paddingHorizontal: 10,
		alignItems: 'center',
	},
	itemsContainer: {
		width: '100%',
		flexDirection: 'row',
		alignItems: 'stretch',
		justifyContent: 'center',
		flexWrap: 'nowrap',
		gap: 10,
		marginTop: 20,
	},
	icon: {
		width: 120,
		height: 120,
		resizeMode: 'contain',
		marginBottom: 10,
	},
});

export default AppDownloadSelection;
