import React, { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, AppState, AppStateStatus, Text, TouchableOpacity, View } from 'react-native';
import * as Updates from 'expo-updates';
import useDebugMode from '@/hooks/useDebugMode';

import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import usePlatformHelper from '@/helper/platformHelper';
import { isInExpoGo } from '@/helper/DeviceRuntimeHelper';
import { useTheme } from '@/hooks/useTheme';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '@/redux/hooks';
import { SET_SIMULATE_EXPO_UPDATE_AVAILABLE } from '@/redux/Types/types';
import AppButton from '@/components/AppButton';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';

const useAppForegroundUpdateCheckModal = () => {
	const { translate, language } = useLanguage();
	const isRtl = language === 'ar';
	const appState = useRef<AppStateStatus>(AppState.currentState);
        const debugMode = useDebugMode();
        const { isSmartPhone } = usePlatformHelper();
        const { show, close } = useMyScrollViewModal();
        const { theme } = useTheme();
        const dispatch = useDispatch();
        const { simulateExpoUpdateAvailable } = useAppSelector((state) => state.settings);

        const showStatusModal = useCallback(
                (
                        options: {
                                title: string;
                                message: string;
                                loading?: boolean;
                                primaryAction?: { label: string; onPress: () => void };
                                allowClose?: boolean;
                        },
                        { force }: { force?: boolean } = {}
                ) => {
                        if (!debugMode && !force) return;

                        const { title, message, loading, primaryAction, allowClose } = options;

                        const buttonBaseStyle = {
                                flex: 1,
                                padding: 12,
                                borderRadius: 8,
                                alignItems: 'center' as const,
                        };

                        show({
                                title,
				titleTextAlign: isRtl ? 'right' : 'left',
				titleWritingDirection: isRtl ? 'rtl' : 'ltr',
                                children: (
                                        <View style={{ padding: 24, gap: 12 }}>
                                                <Text style={{ color: theme.screen.text, textAlign: 'center' }}>{message}</Text>
                                                {loading && <ActivityIndicator color={theme.screen.text} />}
                                                {(primaryAction || allowClose) && (
                                                        <View style={{ flexDirection: 'row', gap: 8 }}>
                                                                {allowClose && (
                                                                        <AppButton
                                                                                variant="ghost"
                                                                                usePlainText
                                                                                text={translate(TranslationKeys.close)}
                                                                                onPress={close}
                                                                                style={{
                                                                                        ...buttonBaseStyle,
                                                                                        borderWidth: 1,
                                                                                        borderColor: theme.sheet.text,
                                                                                        marginVertical: 0,
                                                                                }}
                                                                                textStyle={{ color: theme.screen.text }}
                                                                        />
                                                                )}
                                                                {primaryAction && (
                                                                        <AppButton
                                                                                variant="ghost"
                                                                                usePlainText
                                                                                text={primaryAction.label}
                                                                                onPress={primaryAction.onPress}
                                                                                style={{
                                                                                        ...buttonBaseStyle,
                                                                                        backgroundColor: theme.sheet.text,
                                                                                        marginVertical: 0,
                                                                                }}
                                                                                textStyle={{ color: theme.screen.background, fontWeight: '600' }}
                                                                        />
                                                                )}
                                                        </View>
                                                )}
                                        </View>
                                ),
                        });
                },
                [close, debugMode, isRtl, show, theme.screen.background, theme.screen.text, theme.sheet.text]
        );

        const handleDownloadUpdate = useCallback(async () => {
                showStatusModal(
                        {
                                title: translate(TranslationKeys.downloading_update_title),
                                message: translate(TranslationKeys.downloading_available_update),
                                loading: true,
                        },
                        { force: true }
                );

                try {
                        await Updates.fetchUpdateAsync();
                        showStatusModal(
                                {
                                        title: translate(TranslationKeys.update_ready_title),
                                        message: translate(TranslationKeys.reloading_app_with_newest_update),
                                        loading: true,
                                },
                                { force: true }
                        );
                        await Updates.reloadAsync();
                } catch (error) {
                        console.error('Error while fetching Expo updates', error);
                        showStatusModal(
                                {
                                        title: translate(TranslationKeys.update_download_failed_title),
                                        message: translate(TranslationKeys.update_download_failed_message),
                                        allowClose: true,
                                },
                                { force: true }
                        );
                }
        }, [showStatusModal, translate]);

        const checkForUpdate = useCallback(async () => {
                showStatusModal({
                        title: translate(TranslationKeys.update_check_title),
                        message: translate(TranslationKeys.checking_for_updates),
                        loading: true,
                });

                if (simulateExpoUpdateAvailable) {
                        dispatch({ type: SET_SIMULATE_EXPO_UPDATE_AVAILABLE, payload: false });
                        showStatusModal(
                                {
                                        title: translate(TranslationKeys.update_found_title),
                                        message: translate(TranslationKeys.update_available),
                                        primaryAction: {
                                                label: translate(TranslationKeys.download_and_update_label),
                                                onPress: handleDownloadUpdate,
                                        },
                                },
                                { force: true }
                        );
                        return true;
                }

                if (!isSmartPhone()) {
                        console.info('Update-Check blockiert: nur auf Smartphones verfügbar.');
                        showStatusModal({
                                title: translate(TranslationKeys.update_check_title),
                                message: translate(TranslationKeys.skipped_not_running_on_smartphone),
                                allowClose: true,
                        });
                        return false;
                }
                if (isInExpoGo()) {
                        console.info('Update-Check blockiert: Expo Go wird nicht unterstützt.');
                        showStatusModal({
                                title: translate(TranslationKeys.update_check_title),
                                message: translate(TranslationKeys.skipped_not_available_inside_expo_go),
                                allowClose: true,
                        });
                        return false;
                }

                try {
                        const update = await Updates.checkForUpdateAsync();
                        if (update.isAvailable) {
                                showStatusModal(
                                        {
                                                title: translate(TranslationKeys.update_found_title),
                                                message: translate(TranslationKeys.update_available),
                                                primaryAction: {
                                                        label: translate(TranslationKeys.download_and_update_label),
                                                        onPress: handleDownloadUpdate,
                                                },
                                        },
                                        { force: true }
                                );
                        } else {
                                showStatusModal({
                                        title: translate(TranslationKeys.no_update_found_title),
                                        message: translate(TranslationKeys.no_update_available),
                                        allowClose: true,
                                });
                        }
                        return update.isAvailable;
                } catch (error) {
                        console.error('Error while checking Expo updates', error);
                        showStatusModal({
                                title: translate(TranslationKeys.update_check_failed_title),
                                message: translate(TranslationKeys.update_check_problem_message),
                                allowClose: true,
                        });
                        return false;
                }
        }, [
                dispatch,
                handleDownloadUpdate,
                isSmartPhone,
                simulateExpoUpdateAvailable,
                showStatusModal,
                translate,
        ]);

        const handleAppForeground = useCallback(async () => {
                await checkForUpdate();
        }, [checkForUpdate]);

        useEffect(() => {
                const subscription = AppState.addEventListener('change', nextState => {
                        if (appState.current.match(/inactive|background/) && nextState === 'active') {
                                void handleAppForeground();
                        }
                        appState.current = nextState;
                });

                return () => {
                        subscription.remove();
                };
        }, [handleAppForeground]);
};

export default useAppForegroundUpdateCheckModal;
