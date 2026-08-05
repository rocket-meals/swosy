import React from 'react';
import { ScrollView, View } from 'react-native';
import { LicenseInformation as LicenseList, getLicensesFromExtra } from 'repo-depkit-common-ui';
import Constants from 'expo-constants';
import { useTheme } from '@/hooks/useTheme';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import CollectibleSpot from '@/components/CollectibleItem/CollectibleSpot';
import { CollectibleAt } from 'repo-depkit-common';

const LicenseInformation = () => {
	useSetPageTitle(TranslationKeys.license_information);
	const { theme } = useTheme();
	const licenses = getLicensesFromExtra(Constants.expoConfig?.extra);

	return (
		<View style={{ flex: 1, backgroundColor: theme.screen.background }}>
			<ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}>
				<LicenseList packages={licenses} />
				<CollectibleSpot collectibleKey={CollectibleAt.collectible_at_license_information} />
			</ScrollView>
		</View>
	);
};

export default LicenseInformation;
