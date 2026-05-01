import React, { useCallback } from 'react';
import { Text, View } from 'react-native';

import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { TranslationKeys } from '@/locales/keys';
import useIsLtrLanguage from '@/hooks/useIsLtrLanguage';

const useMyScrollviewModalDistanceInformation = () => {
	const { show, close } = useMyScrollViewModal();
	const { translate, language } = useLanguage();
	const { theme } = useTheme();
	const isLtrLanguage = useIsLtrLanguage();
	const isRtl = !isLtrLanguage;

	const openDistanceInformationModal = useCallback(() => {
		show({
			title: translate(TranslationKeys.distance),
			titleTextAlign: isRtl ? 'right' : 'left',
			titleWritingDirection: isRtl ? 'rtl' : 'ltr',
			onClose: close,
			children: (
				<View>
					<Text style={{ color: theme.screen.text, textAlign: 'center' }}>
						{translate(TranslationKeys.distance_based_on_selected_canteen)}
					</Text>
				</View>
			),
		});
	}, [close, isRtl, show, theme.screen.text, translate]);

	return { openDistanceInformationModal, closeDistanceInformationModal: close };
};

export default useMyScrollviewModalDistanceInformation;
