import React from 'react';
import {Image, ScrollView, Text, TouchableOpacity, View, StyleSheet, useWindowDimensions} from 'react-native';
import {useAppSelector} from '@/redux/hooks';
import {useTheme} from '@/hooks/useTheme';
import {TranslationKeys} from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import {CommonSystemActionHelper} from '@/helper/SystemActionHelper';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {getImageUrl} from '@/constants/HelperFunctions';
import {getAppIconInsideExpoLocalSaved} from '@/config';
import {myContrastColor} from '@/helper/ColorHelper';
import {ServerInfoHelper} from '@/helper/ServerInfoHelper';

const AppDownloadSelection = () => {
	useSetPageTitle(TranslationKeys.app_download_selection);
	const {theme} = useTheme();
	const {serverInfo, appSettings, primaryColor, selectedTheme: mode} = useAppSelector((state) => state.settings);
	const {width: screenWidth} = useWindowDimensions();

	const contrastColor = myContrastColor(primaryColor, theme, mode === 'dark');

	const projectLogo = serverInfo?.info?.project?.project_logo && getImageUrl(serverInfo.info.project.project_logo);
	const iconSource = projectLogo ? {uri: projectLogo} : getAppIconInsideExpoLocalSaved();

	const projectName = ServerInfoHelper.getServerName(serverInfo || {});
	const projectDescriptor = serverInfo?.info?.project?.project_descriptor || '';

	const buttonWidth = Math.min(screenWidth * 0.8, 320);

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
			style={[styles.container, {backgroundColor: theme.screen.background}]}
			contentContainerStyle={styles.contentContainer}
		>
			<View style={[styles.heroSection, {backgroundColor: primaryColor}]}>
				<Image source={iconSource} style={styles.projectLogo} />
				<Text style={[styles.projectName, {color: contrastColor}]}>{projectName}</Text>
				{projectDescriptor ? (
					<Text style={[styles.projectDescriptor, {color: contrastColor}]}>{projectDescriptor}</Text>
				) : null}
				<View style={styles.buttonsContainer}>
					<TouchableOpacity
						style={[styles.storeButton, {width: buttonWidth, backgroundColor: 'rgba(0,0,0,0.25)'}]}
						onPress={handleOpenAppleStore}
					>
						<MaterialCommunityIcons name="apple" size={28} color={contrastColor} />
						<Text style={[styles.storeButtonText, {color: contrastColor}]}>iOS</Text>
						<MaterialCommunityIcons name="open-in-new" size={20} color={contrastColor} />
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.storeButton, {width: buttonWidth, backgroundColor: 'rgba(0,0,0,0.25)'}]}
						onPress={handleOpenGooglePlay}
					>
						<MaterialCommunityIcons name="android" size={28} color={contrastColor} />
						<Text style={[styles.storeButtonText, {color: contrastColor}]}>Android</Text>
						<MaterialCommunityIcons name="open-in-new" size={20} color={contrastColor} />
					</TouchableOpacity>
				</View>
			</View>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	contentContainer: {
		flexGrow: 1,
	},
	heroSection: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 40,
		paddingHorizontal: 20,
		minHeight: 500,
		gap: 8,
	},
	projectLogo: {
		width: 80,
		height: 80,
		resizeMode: 'contain',
		marginBottom: 8,
		borderRadius: 12,
	},
	projectName: {
		fontSize: 32,
		fontWeight: 'bold',
		textAlign: 'center',
	},
	projectDescriptor: {
		fontSize: 18,
		textAlign: 'center',
		paddingHorizontal: 20,
		marginBottom: 8,
	},
	buttonsContainer: {
		gap: 12,
		marginTop: 16,
		alignItems: 'center',
	},
	storeButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 16,
		paddingHorizontal: 24,
		borderRadius: 12,
	},
	storeButtonText: {
		fontSize: 18,
		fontWeight: '600',
		flex: 1,
		marginLeft: 12,
	},
});

export default AppDownloadSelection;
