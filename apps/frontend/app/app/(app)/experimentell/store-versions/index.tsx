import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SettingsListGroupTitle } from 'repo-depkit-common-ui';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import SettingsList from '@/components/SettingsList/SettingsList';
import useCustomerConfig from '@/hooks/useCustomerConfig';
import { getVersionInternalForAppsettingsScreen } from '@/config';
import { CommonSystemActionHelper } from '@/helper/SystemActionHelper';
import { StoreVersionComparison, StoreVersionHelper, StoreVersionResult } from '@/helper/StoreVersionHelper';

const COMPARISON_TEXT_KEYS: Record<StoreVersionComparison, TranslationKeys> = {
	newer_in_store: TranslationKeys.store_versions_newer_in_store,
	up_to_date: TranslationKeys.store_versions_up_to_date,
	older_in_store: TranslationKeys.store_versions_older_in_store,
	unknown: TranslationKeys.unknown,
};

const COMPARISON_ICONS: Record<StoreVersionComparison, keyof typeof MaterialCommunityIcons.glyphMap> = {
	newer_in_store: 'arrow-up-bold-circle-outline',
	up_to_date: 'check-circle-outline',
	older_in_store: 'arrow-down-bold-circle-outline',
	unknown: 'help-circle-outline',
};

type StoreSectionProps = {
	title: string;
	installedVersion: string;
	result: StoreVersionResult | null;
};

const StoreSection = ({ title, installedVersion, result }: StoreSectionProps) => {
	const { theme } = useTheme();
	const { translate } = useLanguage();

	let versionText = translate(TranslationKeys.loading);
	if (result) {
		versionText = result.version ?? `${translate(TranslationKeys.error)}: ${result.error ?? ''}`;
	}
	const comparison = result ? StoreVersionHelper.compare(installedVersion, result.version) : 'unknown';
	const storeUrl = result?.storeUrl;

	return (
		<>
			<SettingsListGroupTitle title={title} />
			<SettingsList
				label={translate(TranslationKeys.store_versions_store_version)}
				value={versionText}
				groupPosition="top"
				showSeparator
				leftIcon={<MaterialCommunityIcons name="store-outline" size={22} color={theme.screen.icon} />}
				iconBgColor="transparent"
			/>
			<SettingsList
				label={translate(TranslationKeys.store_versions_status)}
				value={result ? translate(COMPARISON_TEXT_KEYS[comparison]) : translate(TranslationKeys.loading)}
				groupPosition={storeUrl ? 'middle' : 'bottom'}
				showSeparator={!!storeUrl}
				leftIcon={<MaterialCommunityIcons name={COMPARISON_ICONS[comparison]} size={22} color={theme.screen.icon} />}
				iconBgColor="transparent"
			/>
			{storeUrl && (
				<SettingsList
					label={translate(TranslationKeys.store_versions_open_store)}
					handleFunction={() => CommonSystemActionHelper.openExternalURL(storeUrl, true)}
					groupPosition="bottom"
					showSeparator={false}
					leftIcon={<MaterialCommunityIcons name="open-in-new" size={22} color={theme.screen.icon} />}
					iconBgColor="transparent"
				/>
			)}
		</>
	);
};

const StoreVersions = () => {
	useSetPageTitle(TranslationKeys.store_versions);
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const customerConfig = useCustomerConfig();
	const installedVersion = getVersionInternalForAppsettingsScreen();

	const [appStoreResult, setAppStoreResult] = useState<StoreVersionResult | null>(null);
	const [googlePlayResult, setGooglePlayResult] = useState<StoreVersionResult | null>(null);

	const loadStoreVersions = useCallback(() => {
		setAppStoreResult(null);
		setGooglePlayResult(null);
		StoreVersionHelper.fetchAppStoreVersion(customerConfig.bundleIdIos).then(setAppStoreResult);
		StoreVersionHelper.fetchGooglePlayVersion(customerConfig.bundleIdAndroid).then(setGooglePlayResult);
	}, [customerConfig.bundleIdIos, customerConfig.bundleIdAndroid]);

	useEffect(() => {
		loadStoreVersions();
	}, [loadStoreVersions]);

	return (
		<ScrollView style={[styles.container, { backgroundColor: theme.screen.background }]} contentContainerStyle={{ backgroundColor: theme.screen.background }}>
			<View style={styles.content}>
				<Text style={[styles.heading, { color: theme.screen.text }]}>{translate(TranslationKeys.store_versions)}</Text>
				<Text style={[styles.hint, { color: theme.screen.text }]}>{translate(TranslationKeys.store_versions_hint)}</Text>
				<SettingsList
					label={translate(TranslationKeys.store_versions_installed)}
					value={installedVersion}
					groupPosition="top"
					showSeparator
					leftIcon={<MaterialCommunityIcons name="cellphone-information" size={22} color={theme.screen.icon} />}
					iconBgColor="transparent"
				/>
				<SettingsList
					label={translate(TranslationKeys.store_versions_reload)}
					handleFunction={loadStoreVersions}
					groupPosition="bottom"
					showSeparator={false}
					leftIcon={<MaterialCommunityIcons name="refresh" size={22} color={theme.screen.icon} />}
					iconBgColor="transparent"
				/>
				<StoreSection title="App Store" installedVersion={installedVersion} result={appStoreResult} />
				<StoreSection title="Google Play" installedVersion={installedVersion} result={googlePlayResult} />
			</View>
		</ScrollView>
	);
};

export default StoreVersions;

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		width: '100%',
		height: '100%',
		padding: 20,
	},
	heading: {
		fontSize: 24,
		fontFamily: 'Poppins_700Bold',
		marginVertical: 10,
	},
	hint: {
		fontSize: 14,
		fontFamily: 'Poppins_400Regular',
		marginBottom: 10,
	},
});
