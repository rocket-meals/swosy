import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppDownloadBanner as CommonUiAppDownloadBanner, getMobileWebPlatform } from 'repo-depkit-common-ui';
import { useAppSelector } from '@/redux/hooks';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import useKioskMode from '@/hooks/useKioskMode';
import useCustomerConfig from '@/hooks/useCustomerConfig';
import { getImageUrl } from '@/constants/HelperFunctions';
import { CommonSystemActionHelper } from '@/helper/SystemActionHelper';
import { ServerInfoHelper } from '@/helper/ServerInfoHelper';
import { dismissAppDownloadBanner, isAppDownloadBannerDismissed } from '@/helper/appDownloadBannerStorage';

/**
 * App-store-style "get the app" banner shown at the very top of the web app
 * when the visitor uses a mobile browser (and the app is not running in kiosk
 * mode). The visual component lives in common-ui (AppDownloadBanner); this
 * wrapper wires it up with redux state, translations, customer config and the
 * sessionStorage-based dismiss state.
 * Store links come from app_settings (app_stores_url_to_apple/_google), with a
 * fallback built from the customer config's store identifiers.
 */
const AppDownloadBanner: React.FC = () => {
	const { translate } = useLanguage();
	const kioskMode = useKioskMode();
	const { appSettings, serverInfo, primaryColor, selectedTheme: mode } = useAppSelector(state => state.settings);
	const loggedIn = useAppSelector(state => state.authReducer.loggedIn);
	const [dismissed, setDismissed] = useState<boolean>(() => isAppDownloadBannerDismissed());

	// The banner is mounted once in the root layout and stays mounted across
	// navigation, so a logout (which clears the sessionStorage flag in
	// logoutHelper.ts) wouldn't otherwise be reflected until a full page
	// reload. Re-read the (now cleared) dismissed flag whenever the user logs
	// out, so the banner can reappear immediately for the next visitor.
	const wasLoggedInRef = useRef(loggedIn);
	useEffect(() => {
		if (wasLoggedInRef.current && !loggedIn) {
			setDismissed(isAppDownloadBannerDismissed());
		}
		wasLoggedInRef.current = loggedIn;
	}, [loggedIn]);

	// Reactive to the in-app backend/customer switcher (useCustomerConfigModal),
	// unlike the static, build-time getCustomerConfig() - so the banner's icon,
	// name and store links stay correct after switching customers at runtime.
	const customerConfig = useCustomerConfig();

	const mobilePlatform = useMemo(() => getMobileWebPlatform(), []);

	const storeUrl = useMemo(() => {
		if (!mobilePlatform) return null;
		if (mobilePlatform === 'ios') {
			if (appSettings?.app_stores_url_to_apple) return appSettings.app_stores_url_to_apple;
			if (customerConfig?.appleAppId) return `https://apps.apple.com/app/id${customerConfig.appleAppId}`;
			return null;
		}
		if (appSettings?.app_stores_url_to_google) return appSettings.app_stores_url_to_google;
		if (customerConfig?.bundleIdAndroid) return `https://play.google.com/store/apps/details?id=${customerConfig.bundleIdAndroid}`;
		return null;
	}, [mobilePlatform, appSettings?.app_stores_url_to_apple, appSettings?.app_stores_url_to_google]);

	const handleDismiss = useCallback(() => {
		setDismissed(true);
		dismissAppDownloadBanner();
	}, []);

	const handleOpenStore = useCallback((url: string) => {
		CommonSystemActionHelper.openExternalURL(url, true);
	}, []);

	const projectLogo = serverInfo?.info?.project?.project_logo ? getImageUrl(serverInfo.info.project.project_logo) : null;
	const iconSource = projectLogo ? { uri: projectLogo } : customerConfig.images.icon_logo_source_get_for_react_native();
	const projectName = ServerInfoHelper.getServerName(serverInfo || {}, customerConfig);

	return (
		<CommonUiAppDownloadBanner
			texts={{
				title: projectName,
				subtitle: translate(TranslationKeys.download_or_open_the_app),
				openButtonLabel: translate(TranslationKeys.app_banner_open),
				dismissAccessibilityLabel: translate(TranslationKeys.cancel),
			}}
			iconSource={iconSource}
			accentColor={primaryColor}
			isDarkTheme={mode === 'dark'}
			storeUrl={storeUrl}
			onOpenStore={handleOpenStore}
			onDismiss={handleDismiss}
			visible={!kioskMode && !dismissed}
		/>
	);
};

export default AppDownloadBanner;
