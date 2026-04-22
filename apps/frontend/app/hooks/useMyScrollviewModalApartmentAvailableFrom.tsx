import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { TranslationKeys } from '@/locales/keys';
import useIsLtrLanguage from '@/hooks/useIsLtrLanguage';
import useLanguageTextAlign from '@/hooks/useLanguageTextAlign';

const useMyScrollviewModalApartmentAvailableFrom = () => {
	const { show, close } = useMyScrollViewModal();
	const isLtrLanguage = useIsLtrLanguage();
	const { translate, language } = useLanguage();
	const languageTextAlign = useLanguageTextAlign();
	const { theme } = useTheme();

	const openApartmentAvailableFromModal = useCallback(
		(availableFrom: string) => {
			if (!availableFrom) return;
			const date = new Date(availableFrom);
			const formatted = date.toLocaleDateString(language, { year: 'numeric', month: 'long', day: 'numeric' });
			show({
				title: translate(TranslationKeys.free_rooms),
				onClose: close,
				titleTextAlign: languageTextAlign,
				titleWritingDirection: isLtrLanguage ? 'ltr' : 'rtl',
				children: (
					<View>
						<Text style={[styles.text, { color: theme.screen.text }]}>
							{translate(TranslationKeys.free_from)}: {formatted}
						</Text>
					</View>
				),
			});
		},
		[close, language, show, theme.screen.text, translate]
	);

	return { openApartmentAvailableFromModal, closeApartmentAvailableFromModal: close };
};

const styles = StyleSheet.create({
	text: {
		textAlign: 'center',
	},
});

export default useMyScrollviewModalApartmentAvailableFrom;
