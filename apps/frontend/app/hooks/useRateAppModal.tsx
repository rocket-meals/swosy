import React, { useCallback, useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import * as StoreReview from 'expo-store-review';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '@/redux/hooks';

import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import { TranslationKeys } from '@/locales/keys';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { myContrastColor } from '@/helper/ColorHelper';
import { CommonSystemActionHelper } from '@/helper/SystemActionHelper';
import styles from '@/app/(app)/collectible-event/styles';
import AppButton from '@/components/AppButton';

const useRateAppModal = (buttonColorOverride?: string) => {
        const { show, close } = useMyScrollViewModal();
        const { translate } = useLanguage();
        const { theme } = useTheme();
        const { appSettings, selectedTheme: mode } = useAppSelector((state) => state.settings);

        const rateButtonColor = buttonColorOverride || theme.primary;
        const rateButtonTextColor = useMemo(
                () => myContrastColor(rateButtonColor, theme, mode === 'dark'),
                [mode, rateButtonColor, theme]
        );

        const handleRateApp = useCallback(async () => {
                try {
                        const isAvailable = await StoreReview.isAvailableAsync();
                        if (isAvailable) {
                                await StoreReview.requestReview();
                        }
                } catch (error) {
                        console.log('Error requesting review', error);
                } finally {
                        close();
                }
        }, [close]);

        const openRateAppModal = useCallback(async () => {
                let canRate = false;

                try {
                        const [isAvailable, hasAction] = await Promise.all([
                                StoreReview.isAvailableAsync(),
                                typeof StoreReview.hasAction === 'function' ? StoreReview.hasAction() : Promise.resolve(false),
                        ]);

                        canRate = isAvailable && !hasAction;
                } catch (error) {
                        console.log('Error checking review availability', error);
                }

                show(
                        {
                                children: (
                                        <View style={{ padding: 24, gap: 12 }}>
                                                <Text
                                                        style={{
                                                                ...styles.title,
                                                                color: theme.screen.text,
                                                                textAlign: 'center',
                                                        }}
                                                >
                                                        {translate(TranslationKeys.collectible_event_congratulations_title)}
                                                </Text>

                                                <Text
                                                        style={{
                                                                ...styles.label,
                                                                color: theme.screen.text,
                                                                textAlign: 'center',
                                                        }}
                                                >
                                                        {translate(TranslationKeys.collectible_event_rate_app_prompt)}
                                                </Text>

                                                {canRate && (
                                                        <AppButton
                                                                variant="ghost"
                                                                usePlainText
                                                                text={translate(TranslationKeys.rate_now)}
                                                                onPress={handleRateApp}
                                                                style={{
                                                                        ...styles.button,
                                                                        backgroundColor: rateButtonColor,
                                                                        marginVertical: 0,
                                                                }}
                                                                textStyle={{ ...styles.buttonText, color: rateButtonTextColor }}
                                                        />
                                                )}

                                                <AppButton
                                                        variant="ghost"
                                                        usePlainText
                                                        text={translate(TranslationKeys.rate_later)}
                                                        onPress={close}
                                                        style={{ ...styles.button, backgroundColor: theme.drawerBg, marginVertical: 0 }}
                                                        textStyle={{ ...styles.buttonText, color: theme.screen.text }}
                                                />

                                                <View style={{ gap: 12 }}>
                                                        <AppButton
                                                                variant="ghost"
                                                                usePlainText
                                                                text="Google Play Store"
                                                                onPress={() => {
                                                                        if (appSettings?.app_stores_url_to_google) {
                                                                                CommonSystemActionHelper.openExternalURL(
                                                                                        appSettings?.app_stores_url_to_google,
                                                                                        true
                                                                                );
                                                                        }
                                                                }}
                                                                style={{
                                                                        ...styles.button,
                                                                        marginTop: 0,
                                                                        flexDirection: 'row',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        backgroundColor: rateButtonColor,
                                                                        marginVertical: 0,
                                                                }}
                                                                textStyle={{ ...styles.buttonText, color: rateButtonTextColor }}
                                                                iconLeft={
                                                                        <Ionicons
                                                                                name="logo-google-playstore"
                                                                                size={20}
                                                                                color={rateButtonTextColor}
                                                                                style={{ marginRight: 8 }}
                                                                        />
                                                                }
                                                        />

                                                        <AppButton
                                                                variant="ghost"
                                                                usePlainText
                                                                text="App Store"
                                                                onPress={() => {
                                                                        if (appSettings?.app_stores_url_to_apple) {
                                                                                CommonSystemActionHelper.openExternalURL(
                                                                                        appSettings?.app_stores_url_to_apple,
                                                                                        true
                                                                                );
                                                                        }
                                                                }}
                                                                style={{
                                                                        ...styles.button,
                                                                        marginTop: 0,
                                                                        flexDirection: 'row',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        backgroundColor: rateButtonColor,
                                                                        marginVertical: 0,
                                                                }}
                                                                textStyle={{ ...styles.buttonText, color: rateButtonTextColor }}
                                                                iconLeft={
                                                                        <Ionicons
                                                                                name="logo-apple"
                                                                                size={20}
                                                                                color={rateButtonTextColor}
                                                                                style={{ marginRight: 8 }}
                                                                        />
                                                                }
                                                        />
                                                </View>
                                        </View>
                                ),
                        },
                        {}
                );
        }, [
                appSettings?.app_stores_url_to_apple,
                appSettings?.app_stores_url_to_google,
                close,
                handleRateApp,
                rateButtonColor,
                rateButtonTextColor,
                show,
                theme.drawerBg,
                theme.screen.text,
                translate,
        ]);

        return { openRateAppModal };
};

export default useRateAppModal;
