import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, AppStateStatus, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Updates from 'expo-updates';
import usePlatformHelper from '@/helper/platformHelper';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import { useTheme } from '@/hooks/useTheme';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducer';
import { myContrastColor } from '@/helper/ColorHelper';
import { isInExpoGo } from '@/helper/DeviceRuntimeHelper';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';

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
        const { show: showScrollViewModal, close: closeScrollViewModal } = useMyScrollViewModal();

        const backgroundColor = theme.sheet?.sheetBg ?? theme.screen.background;

        const openUpdateModal = useCallback(
                ({ titleKey, messageKey, isUpdateAvailable }: { titleKey: TranslationKeys; messageKey: TranslationKeys; isUpdateAvailable: boolean }) => {
                        showScrollViewModal(
                                {
                                        title: translate(titleKey),
                                        onClose: closeScrollViewModal,
                                        children: (
                                                <UpdateModalContent
                                                        updateAvailable={isUpdateAvailable}
                                                        messageKey={messageKey}
                                                        translate={translate}
                                                        theme={theme}
                                                        primaryColor={primaryColor}
                                                        contrastColor={contrastColor}
                                                        closeModal={closeScrollViewModal}
                                                />
                                        ),
                                },
                                {
                                        backgroundStyle: { backgroundColor },
                                        headerBackgroundColor: backgroundColor,
                                }
                        );
                },
                [backgroundColor, closeScrollViewModal, contrastColor, primaryColor, showScrollViewModal, theme, translate]
        );

        const checkForUpdates = async (showUpToDate = false) => {
                if (!isSmartPhone()) return;
                if (isInExpoGo()) return;
                try {
                        const update = await Updates.checkForUpdateAsync();
                        if (update.isAvailable) {
                                openUpdateModal({
                                        titleKey: TranslationKeys.update_available,
                                        messageKey: TranslationKeys.update_available_message,
                                        isUpdateAvailable: true,
                                });
                        } else if (showUpToDate) {
                                openUpdateModal({
                                        titleKey: TranslationKeys.updates,
                                        messageKey: TranslationKeys.no_updates_available,
                                        isUpdateAvailable: false,
                                });
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

        return (
                <UpdateCheckerContext.Provider value={{ manualCheck: () => checkForUpdates(true) }}>
                        {children}
                </UpdateCheckerContext.Provider>
        );
};

type UpdateModalContentProps = {
        updateAvailable: boolean;
        messageKey: TranslationKeys;
        translate: ReturnType<typeof useLanguage>['translate'];
        theme: ReturnType<typeof useTheme>['theme'];
        primaryColor: string;
        contrastColor: string;
        closeModal: () => void;
};

const UpdateModalContent: React.FC<UpdateModalContentProps> = ({
        updateAvailable,
        messageKey,
        translate,
        theme,
        primaryColor,
        contrastColor,
        closeModal,
}) => {
        const [updating, setUpdating] = useState(false);

        const applyUpdate = useCallback(async () => {
                try {
                        setUpdating(true);
                        await Updates.fetchUpdateAsync();
                        await Updates.reloadAsync();
                } catch (e) {
                        console.error('Error while applying updates', e);
                        setUpdating(false);
                }
        }, []);

        return (
                <>
                        <View style={{ padding: 20 }}>
                                <Text style={{ color: theme.screen.text, textAlign: 'center' }}>{translate(messageKey)}</Text>
                        </View>
                        <View style={modalStyles.buttonContainer}>
                                <TouchableOpacity onPress={closeModal} style={[modalStyles.cancelButton, { borderColor: primaryColor }]}>
                                        <Text style={[modalStyles.buttonText, { color: theme.screen.text }]}>
                                                {translate(updateAvailable ? TranslationKeys.cancel : TranslationKeys.okay)}
                                        </Text>
                                </TouchableOpacity>
                                {updateAvailable && (
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
                </>
        );
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
