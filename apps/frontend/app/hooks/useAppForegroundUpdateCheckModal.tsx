import React, { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, AppState, AppStateStatus, Text, TouchableOpacity, View } from 'react-native';
import * as Updates from 'expo-updates';
import { useSelector } from 'react-redux';

import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import usePlatformHelper from '@/helper/platformHelper';
import { RootState } from '@/redux/reducer';
import { isInExpoGo } from '@/helper/DeviceRuntimeHelper';
import { useTheme } from '@/hooks/useTheme';

const useAppForegroundUpdateCheckModal = () => {
        const appState = useRef<AppStateStatus>(AppState.currentState);
        const { appSettings } = useSelector((state: RootState) => state.settings);
        const { isSmartPhone } = usePlatformHelper();
        const { show, close } = useMyScrollViewModal();
        const { theme } = useTheme();

        const showStatusModal = useCallback(
                (options: {
                        title: string;
                        message: string;
                        loading?: boolean;
                        primaryAction?: { label: string; onPress: () => void };
                        allowClose?: boolean;
                }) => {
                        const { title, message, loading, primaryAction, allowClose } = options;

                        const buttonBaseStyle = {
                                flex: 1,
                                padding: 12,
                                borderRadius: 8,
                                alignItems: 'center' as const,
                        };

                        show({
                                title,
                                children: (
                                        <View style={{ padding: 24, gap: 12 }}>
                                                <Text style={{ color: theme.screen.text, textAlign: 'center' }}>{message}</Text>
                                                {loading && <ActivityIndicator color={theme.screen.text} />}
                                                {(primaryAction || allowClose) && (
                                                        <View style={{ flexDirection: 'row', gap: 8 }}>
                                                                {allowClose && (
                                                                        <TouchableOpacity
                                                                                onPress={close}
                                                                                style={{
                                                                                        ...buttonBaseStyle,
                                                                                        borderWidth: 1,
                                                                                        borderColor: theme.sheet.text,
                                                                                }}
                                                                        >
                                                                                <Text style={{ color: theme.screen.text }}>Schließen</Text>
                                                                        </TouchableOpacity>
                                                                )}
                                                                {primaryAction && (
                                                                        <TouchableOpacity
                                                                                onPress={primaryAction.onPress}
                                                                                style={{
                                                                                        ...buttonBaseStyle,
                                                                                        backgroundColor: theme.sheet.text,
                                                                                }}
                                                                        >
                                                                                <Text style={{ color: theme.screen.background, fontWeight: '600' }}>
                                                                                        {primaryAction.label}
                                                                                </Text>
                                                                        </TouchableOpacity>
                                                                )}
                                                        </View>
                                                )}
                                        </View>
                                ),
                        });
                },
                [close, show, theme.screen.background, theme.screen.text, theme.sheet.text]
        );

        const handleDownloadUpdate = useCallback(async () => {
                showStatusModal({
                        title: 'Update wird geladen',
                        message: 'Update wird heruntergeladen ...',
                        loading: true,
                });

                try {
                        await Updates.fetchUpdateAsync();
                        showStatusModal({
                                title: 'Update geladen',
                                message: 'Das Update wurde geladen. Bitte App neu starten.',
                                primaryAction: { label: 'App neu starten', onPress: () => void Updates.reloadAsync() },
                                allowClose: true,
                        });
                } catch (error) {
                        console.error('Error while fetching Expo updates', error);
                        showStatusModal({
                                title: 'Update-Download fehlgeschlagen',
                                message: 'Das Update konnte nicht heruntergeladen werden.',
                                allowClose: true,
                        });
                }
        }, [showStatusModal]);

        const checkForUpdate = useCallback(async () => {
                const expoUpdateCheckEnabled =
                        appSettings?.experimental_expo_update_check ||
                        appSettings?.experimentell_expo_update_check;

                showStatusModal({ title: 'Update-Check', message: 'Suche nach Update ...', loading: true });

                if (!expoUpdateCheckEnabled) {
                        showStatusModal({
                                title: 'Update-Check',
                                message: 'Update-Check ist deaktiviert.',
                                allowClose: true,
                        });
                        return false;
                }
                if (!isSmartPhone()) {
                        showStatusModal({
                                title: 'Update-Check',
                                message: 'Update-Check ist nur auf Smartphones verfügbar.',
                                allowClose: true,
                        });
                        return false;
                }
                if (isInExpoGo()) {
                        showStatusModal({
                                title: 'Update-Check',
                                message: 'Expo Go wird nicht unterstützt.',
                                allowClose: true,
                        });
                        return false;
                }

                try {
                        const update = await Updates.checkForUpdateAsync();
                        if (update.isAvailable) {
                                showStatusModal({
                                        title: 'Update gefunden',
                                        message: 'Ein neues Update ist verfügbar.',
                                        primaryAction: { label: 'Update downloaden', onPress: handleDownloadUpdate },
                                        allowClose: true,
                                });
                        } else {
                                showStatusModal({
                                        title: 'Kein Update gefunden',
                                        message: 'Du verwendest bereits die aktuelle Version.',
                                        allowClose: true,
                                });
                        }
                        return update.isAvailable;
                } catch (error) {
                        console.error('Error while checking Expo updates', error);
                        showStatusModal({
                                title: 'Update-Check fehlgeschlagen',
                                message: 'Es gab ein Problem bei der Update-Prüfung.',
                                allowClose: true,
                        });
                        return false;
                }
        }, [
                appSettings?.experimental_expo_update_check,
                appSettings?.experimentell_expo_update_check,
                handleDownloadUpdate,
                isSmartPhone,
                showStatusModal,
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
