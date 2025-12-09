import React, { useCallback } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import * as StoreReview from 'expo-store-review';

import { useModal } from '@/components/GlobalModal/useModal';
import { TranslationKeys } from '@/locales/keys';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import styles from '@/app/(app)/collectible-event/styles';

const useRateAppModal = (buttonColorOverride?: string) => {
        const { show, close } = useModal();
        const { translate } = useLanguage();
        const { theme } = useTheme();

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

        const openRateAppModal = useCallback(() => {
                show(
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

                                <TouchableOpacity
                                        style={{ ...styles.button, backgroundColor: buttonColorOverride || theme.primary }}
                                        onPress={handleRateApp}
                                >
                                        <Text style={{ ...styles.buttonText, color: theme.dark }}>
                                                {translate(TranslationKeys.rate_now)}
                                        </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                        style={{ ...styles.button, backgroundColor: theme.drawerBg }}
                                        onPress={close}
                                >
                                        <Text style={{ ...styles.buttonText, color: theme.screen.text }}>
                                                {translate(TranslationKeys.rate_later)}
                                        </Text>
                                </TouchableOpacity>
                        </View>,
                        { backgroundStyle: { backgroundColor: theme.sheet?.sheetBg } }
                );
        }, [
                buttonColorOverride,
                close,
                handleRateApp,
                show,
                theme.dark,
                theme.drawerBg,
                theme.primary,
                theme.screen.text,
                theme.sheet?.sheetBg,
                translate,
        ]);

        return { openRateAppModal };
};

export default useRateAppModal;
