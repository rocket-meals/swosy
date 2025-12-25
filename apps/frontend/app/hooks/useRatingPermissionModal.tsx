import React, { useCallback } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { useRouter } from 'expo-router';

import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import ProjectButton from '@/components/ProjectButton';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { TranslationKeys } from '@/locales/keys';
import { performLogout } from '@/helper/logoutHelper';

const useRatingPermissionModal = () => {
	const { show, close } = useMyScrollViewModal();
	const { translate } = useLanguage();
	const { theme } = useTheme();
	const router = useRouter();
	const dispatch = useDispatch();

	const openRatingPermissionModal = useCallback(() => {
		const handleLogin = () => {
			close();
			void performLogout(dispatch, router);
		};

		show({
			title: translate(TranslationKeys.rating_requires_account_title),
			onClose: close,
			children: (
				<View style={{ gap: 12 }}>
					<Text style={{ color: theme.sheet.text }}>
						{translate(TranslationKeys.rating_requires_account_description)}
					</Text>
					<ProjectButton
						text={`${translate(TranslationKeys.sign_in)} / ${translate(TranslationKeys.create_account)}`}
						onPress={handleLogin}
						style={{ marginVertical: 0 }}
					/>
					<TouchableOpacity onPress={close} style={{ alignSelf: 'center', paddingVertical: 6 }}>
						<Text style={{ color: theme.sheet.text }}>
							{translate(TranslationKeys.continue_without_rating)}
						</Text>
					</TouchableOpacity>
				</View>
			),
		});
	}, [close, dispatch, router, show, theme.sheet.text, translate]);

	return { openRatingPermissionModal, closeRatingPermissionModal: close };
};

export default useRatingPermissionModal;
