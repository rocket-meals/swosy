import React, { useCallback } from 'react';
import { Text, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { useRouter } from 'expo-router';

import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import ProjectButton from '@/components/ProjectButton';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { TranslationKeys } from '@/locales/keys';
import { performLogout } from '@/helper/logoutHelper';

const useAccountRequiredModal = () => {
	const { show, close, closeAll } = useMyScrollViewModal();
	const { translate } = useLanguage();
	const { theme } = useTheme();
	const router = useRouter();
	const dispatch = useDispatch();

	const openAccountRequiredModal = useCallback(() => {
		const handleLogin = () => {
			void performLogout(dispatch, router);
		};

		// No onClose here: MyScrollViewModal fires onClose on unmount, and this modal
		// also unmounts when the back chevron pops it while another modal is still on
		// the stack (the stack renders only the top-most item). Passing close would
		// close that remaining modal too instead of returning to it.
		show({
			title: translate(TranslationKeys.access_limited),
			children: (
				<View style={{ gap: 12 }}>
					<Text style={{ color: theme.sheet.text }}>
						{translate(TranslationKeys.limited_access_description)}
					</Text>
					<ProjectButton
						text={`${translate(TranslationKeys.sign_in)} / ${translate(TranslationKeys.create_account)}`}
						onPress={() => {
							closeAll();
							handleLogin();
						}}
						style={{ marginVertical: 0 }}
					/>
				</View>
			),
		});
	}, [closeAll, dispatch, router, show, theme.sheet.text, translate]);

	return { openAccountRequiredModal, closeAccountRequiredModal: close };
};

export default useAccountRequiredModal;
