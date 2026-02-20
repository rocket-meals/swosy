import React, { useCallback, useMemo } from 'react';
import { MaterialIcons, Octicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSelector } from 'react-redux';

import SettingsList from '@/components/SettingsList/SettingsList';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { TranslationKeys } from '@/locales/keys';
import { RootState } from '@/redux/reducer';
import { CommonSystemActionHelper } from '@/helper/SystemActionHelper';

const RATE_APP_ICON_BACKGROUND = '#F7D21F';

type RateAppSettingsItemProps = {
	groupPosition?: 'top' | 'middle' | 'bottom' | 'single';
	showSeparator?: boolean;
	onLog?: (message: string) => void;
};

type StoreTarget = 'ios' | 'android';

export const RateAppSettingsItem: React.FC<RateAppSettingsItemProps> = ({ groupPosition = 'single', showSeparator = false, onLog }) => {
	const { translate } = useLanguage();
	const { theme } = useTheme();
	const { primaryColor, appSettings } = useSelector((state: RootState) => state.settings);

	const iosStoreUrl = appSettings?.app_stores_url_to_apple;
	const androidStoreUrl = appSettings?.app_stores_url_to_google;
	const isWeb = Platform.OS === 'web';
	const hasBothWebLinks = isWeb && Boolean(iosStoreUrl) && Boolean(androidStoreUrl);

	const openStore = useCallback(
		(storeUrl: string, store: StoreTarget) => {
			onLog?.(`Opening ${store} store URL`);
			CommonSystemActionHelper.openExternalURL(storeUrl, true);
		},
		[onLog]
	);

	const rows = useMemo(
		() => [
			{ key: 'ios', store: 'ios' as const, label: 'App Store (iOS)', url: iosStoreUrl },
			{ key: 'android', store: 'android' as const, label: 'Google Play (Android)', url: androidStoreUrl },
		],
		[androidStoreUrl, iosStoreUrl]
	);

	if (isWeb) {
		const visibleRows = rows.filter(row => Boolean(row.url));

		if (!visibleRows.length) {
			return null;
		}

		return (
			<>
				{visibleRows.map((row, index) => {
					const isFirst = index === 0;
					const isLast = index === visibleRows.length - 1;
					const computedGroupPosition = hasBothWebLinks ? (isFirst ? 'top' : 'bottom') : 'single';

					return (
						<SettingsList
							key={row.key}
							label={row.label}
							handleFunction={row.url ? () => openStore(row.url, row.store) : undefined}
							groupPosition={computedGroupPosition}
							showSeparator={!isLast}
							iconBgColor={RATE_APP_ICON_BACKGROUND}
							leftIcon={<MaterialIcons name="star" size={22} color={primaryColor} />}
							rightIcon={row.url ? <Octicons name="chevron-right" size={24} color={theme.screen.icon} /> : undefined}
						/>
					);
				})}
			</>
		);
	}

	const nativeStore = Platform.OS === 'ios' ? 'ios' : 'android';
	const nativeStoreUrl = nativeStore === 'ios' ? iosStoreUrl : androidStoreUrl;

	if (!nativeStoreUrl) {
		return null;
	}

	return (
		<SettingsList
			label={translate(TranslationKeys.rate_app)}
			handleFunction={() => openStore(nativeStoreUrl, nativeStore)}
			groupPosition={groupPosition}
			showSeparator={showSeparator}
			iconBgColor={RATE_APP_ICON_BACKGROUND}
			leftIcon={<MaterialIcons name="star" size={22} color={primaryColor} />}
			rightIcon={<Octicons name="chevron-right" size={24} color={theme.screen.icon} />}
		/>
	);
};
