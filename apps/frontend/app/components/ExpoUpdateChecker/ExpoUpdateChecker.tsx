import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, AppStateStatus, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Updates from 'expo-updates';
import { useModal } from '@/components/GlobalModal/useModal';
import usePlatformHelper from '@/helper/platformHelper';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import { useTheme } from '@/hooks/useTheme';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducer';
import { myContrastColor } from '@/helper/ColorHelper';
import { isInExpoGo } from '@/helper/DeviceRuntimeHelper';
import MyScrollViewModal from '../MyScrollViewModal';

interface ExpoUpdateCheckerProps {
	children?: ReactNode;
}

interface UpdateCheckerContextType {
	manualCheck: () => void;
}

const UpdateCheckerContext = createContext<UpdateCheckerContextType | null>(null);

const ExpoUpdateChecker: React.FC<ExpoUpdateCheckerProps> = ({ children }) => {
	const appState = useRef<AppStateStatus>(AppState.currentState);
	const { isSmartPhone } = usePlatformHelper();
        const { translate } = useLanguage();
        const { theme } = useTheme();
        const { primaryColor, selectedTheme: mode } = useSelector((state: RootState) => state.settings);
        const contrastColor = myContrastColor(primaryColor, theme, mode === 'dark');
        const { show, close } = useModal();
        const [updating, setUpdating] = useState(false);

        const showUpdateModal = (hasUpdate: boolean, title: TranslationKeys, message: TranslationKeys) => {
                show(
                        <MyScrollViewModal
                                title={translate(title)}
                                closeSheet={close}
                                showsVerticalScrollIndicator={false}
                        >
                                <View style={{ padding: 20 }}>
                                        <Text style={{ color: theme.screen.text, textAlign: 'center' }}>{translate(message)}</Text>
                                </View>
                                <View style={modalStyles.buttonContainer}>
                                        <TouchableOpacity onPress={close} style={[modalStyles.cancelButton, { borderColor: primaryColor }]}>
                                                <Text style={[modalStyles.buttonText, { color: theme.screen.text }]}>
                                                        {translate(hasUpdate ? TranslationKeys.cancel : TranslationKeys.okay)}
                                                </Text>
                                        </TouchableOpacity>
                                        {hasUpdate && (
                                                <TouchableOpacity onPress={applyUpdate} style={[modalStyles.saveButton, { backgroundColor: primaryColor }]}>
                                                        {updating ? (
                                                                <ActivityIndicator color={contrastColor} />
                                                        ) : (
                                                                <Text style={[modalStyles.buttonText, { color: contrastColor }]}>
                                                                        {translate(TranslationKeys.to_update)}
                                                                </Text>
                                                        )}
                                                </TouchableOpacity>
                                        )}
                                </View>
                        </MyScrollViewModal>,
                        { backgroundStyle: { backgroundColor: theme.sheet?.sheetBg } },
                );
        };

	const checkForUpdates = async (showUpToDate = false) => {
		if (!isSmartPhone()) return;
		if (isInExpoGo()) return;
		try {
                        const update = await Updates.checkForUpdateAsync();
                        if (update.isAvailable) {
                                showUpdateModal(true, TranslationKeys.update_available, TranslationKeys.update_available_message);
                        } else if (showUpToDate) {
                                showUpdateModal(false, TranslationKeys.updates, TranslationKeys.no_updates_available);
                        }
                } catch (e) {
                        console.error('Error while checking updates', e);
                }
        };

	useEffect(() => {
		if (!isSmartPhone()) return;
		const subscription = AppState.addEventListener('change', nextState => {
			if (appState.current.match(/inactive|background/) && nextState === 'active') {
				checkForUpdates();
			}
			appState.current = nextState;
		});
		return () => {
			subscription.remove();
		};
	}, []);

	const applyUpdate = async () => {
                try {
                        setUpdating(true);
                        await Updates.fetchUpdateAsync();
                        await Updates.reloadAsync();
                } catch (e) {
                        console.error('Error while applying updates', e);
                } finally {
                        setUpdating(false);
                }
        };

        return <UpdateCheckerContext.Provider value={{ manualCheck: () => checkForUpdates(true) }}>{children}</UpdateCheckerContext.Provider>;
};

export const useExpoUpdateChecker = () => {
	const ctx = useContext(UpdateCheckerContext);
	if (!ctx) throw new Error('useExpoUpdateChecker must be used within ExpoUpdateChecker');
	return ctx;
};

export default ExpoUpdateChecker;

const modalStyles = StyleSheet.create({
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '80%',
	},
	cancelButton: {
		flex: 1,
		padding: 10,
		borderRadius: 5,
		marginRight: 5,
		alignItems: 'center',
		borderWidth: 1,
	},
	saveButton: {
		flex: 1,
		padding: 10,
		borderRadius: 5,
		marginLeft: 5,
		alignItems: 'center',
	},
	buttonText: {
		fontWeight: 'bold',
	},
});
