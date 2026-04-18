import React from 'react';
import {Image, ScrollView, Text, View, StyleSheet, useWindowDimensions} from 'react-native';
import {useAppSelector} from '@/redux/hooks';
import {useTheme} from '@/hooks/useTheme';
import {TranslationKeys} from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import {getImageUrl} from '@/constants/HelperFunctions';
import {getAppIconInsideExpoLocalSaved, getCustomerConfig} from '@/config';
import QrCode from '@/components/QrCode';
import useDebugMode from '@/hooks/useDebugMode';
import {myContrastColor} from '@/helper/ColorHelper';
import {ServerInfoHelper} from '@/helper/ServerInfoHelper';

const GITHUB_PAGES_OWNER = 'rocket-meals';
const GITHUB_PAGES_REPO = 'rocket-meals';

const AppDownloadManagement = () => {
	useSetPageTitle(TranslationKeys.app_download);
	const {theme} = useTheme();
	const {serverInfo, primaryColor, selectedTheme: mode} = useAppSelector((state) => state.settings);
	const isDebugMode = useDebugMode();
	const {width: screenWidth} = useWindowDimensions();

	const contrastColor = myContrastColor(primaryColor, theme, mode === 'dark');

	const projectLogo = serverInfo?.info?.project?.project_logo && getImageUrl(serverInfo.info.project.project_logo);
	const iconSource = projectLogo ? {uri: projectLogo} : getAppIconInsideExpoLocalSaved();

	const projectName = ServerInfoHelper.getServerName(serverInfo || {});
	const projectDescriptor = serverInfo?.info?.project?.project_descriptor || '';

	const customerConfig = getCustomerConfig();
	const baseUrl = customerConfig.baseUrl;
	const githubPagesUrl = `https://${GITHUB_PAGES_OWNER}.github.io/${GITHUB_PAGES_REPO}${baseUrl}/experimentell/app-download`;

	const qrSize = Math.min(screenWidth * 0.6, 280);

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
				<View style={styles.qrContainer}>
					<QrCode
						value={githubPagesUrl}
						size={qrSize}
						image={iconSource}
						innerSize={21}
						backgroundColor="white"
					/>
				</View>
				{isDebugMode ? (
					<Text style={[styles.debugLink, {color: contrastColor}]} selectable>{githubPagesUrl}</Text>
				) : null}
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
	},
	projectLogo: {
		width: 80,
		height: 80,
		resizeMode: 'contain',
		marginBottom: 16,
		borderRadius: 12,
	},
	projectName: {
		fontSize: 32,
		fontWeight: 'bold',
		textAlign: 'center',
		marginBottom: 8,
	},
	projectDescriptor: {
		fontSize: 18,
		textAlign: 'center',
		marginBottom: 24,
		paddingHorizontal: 20,
	},
	qrContainer: {
		backgroundColor: 'white',
		borderRadius: 16,
		padding: 16,
		alignItems: 'center',
		justifyContent: 'center',
	},
	debugLink: {
		fontSize: 12,
		textAlign: 'center',
		marginTop: 16,
		opacity: 0.8,
	},
});

export default AppDownloadManagement;
