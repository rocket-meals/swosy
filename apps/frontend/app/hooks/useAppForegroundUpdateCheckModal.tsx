import React, { useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Text, View } from 'react-native';
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
        const { show } = useMyScrollViewModal();
        const { theme } = useTheme();

        const checkForUpdate = useCallback(async () => {
                const expoUpdateCheckEnabled =
                        appSettings?.experimental_expo_update_check ||
                        appSettings?.experimentell_expo_update_check;

                if (!expoUpdateCheckEnabled) return false;
                if (!isSmartPhone()) return false;
                if (isInExpoGo()) return false;

                try {
                        const update = await Updates.checkForUpdateAsync();
                        return update.isAvailable;
                } catch (error) {
                        console.error('Error while checking Expo updates', error);
                        return false;
                }
        }, [appSettings?.experimental_expo_update_check, appSettings?.experimentell_expo_update_check, isSmartPhone]);

        const showUpdateNotice = useCallback(() => {
                show({
                        children: (
                                <View style={{ padding: 24 }}>
                                        <Text style={{ color: theme.screen.text, textAlign: 'center', marginBottom: 8 }}>
                                                Die App hat ein Update.
                                        </Text>
                                        <Text style={{ color: theme.screen.text, textAlign: 'center', fontWeight: '600' }}>
                                                Bitte App Neustarten.
                                        </Text>
                                </View>
                        ),
                });
        }, [show, theme.screen.text]);

        const showNoUpdateNotice = useCallback(() => {
                show({
                        children: (
                                <View style={{ padding: 24 }}>
                                        <Text style={{ color: theme.screen.text, textAlign: 'center' }}>
                                                Kein Update verfügbar.
                                        </Text>
                                </View>
                        ),
                });
        }, [show, theme.screen.text]);

        const handleAppForeground = useCallback(async () => {
                const updateAvailable = await checkForUpdate();
                if (updateAvailable) {
                        showUpdateNotice();
                } else {
                        showNoUpdateNotice();
                }
        }, [checkForUpdate, showNoUpdateNotice, showUpdateNotice]);

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
