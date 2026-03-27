import React, { useCallback } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { useDispatch } from 'react-redux';
import { useRouter } from 'expo-router';

import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import { performLogout } from '@/helper/logoutHelper';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { TranslationKeys } from '@/locales/keys';
import useLogoutButtonTranslation from './useLogoutButtonTranslation';
import AppButton from '@/components/AppButton';

const useConfirmLogoutModal = () => {
        const { show, close } = useMyScrollViewModal();
        const dispatch = useDispatch();
        const router = useRouter();
        const { translate } = useLanguage();
        const { theme } = useTheme();
        const { buttonLabel, modalDescription } = useLogoutButtonTranslation();

        const openConfirmLogoutModal = useCallback(
                () => {
                        const handleLogout = async () => {
                                close();
                                await performLogout(dispatch, router);
                        };

                        show(
                                {
                                        children: (
                                                <View style={{ gap: 12 }}>
                                                        <Text
                                                                style={{
                                                                        fontSize: 18,
                                                                        fontWeight: '600',
                                                                        color: theme.screen.text,
                                                                }}
                                                        >
                                                                {buttonLabel}
                                                        </Text>
                                                        <Text style={{ color: theme.screen.text }}>
                                                                {modalDescription}
                                                        </Text>
                                                        <AppButton
                                                                text={translate(TranslationKeys.confirm)}
                                                                onPress={handleLogout}
                                                                style={{ marginVertical: 0 }}
                                                        />
                                                        <AppButton
                                                                text={translate(TranslationKeys.cancel)}
                                                                onPress={close}
                                                                variant="ghost"
                                                                style={{alignSelf: 'center', paddingVertical: 6}}
                                                                textStyle={{ color: theme.screen.text }}
                                                                usePlainText
                                                        />
                                                </View>
                                        ),
                                },
                                {}
                        );
                },
                [buttonLabel, close, dispatch, modalDescription, router, show, theme.screen.text, translate]
        );

        return { openConfirmLogoutModal, closeConfirmLogoutModal: close };
};

export default useConfirmLogoutModal;
