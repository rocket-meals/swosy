import { useCallback } from 'react';
import { useLanguage } from './useLanguage';
import { useFocusEffect } from 'expo-router';
import { isWeb } from '@/constants/Constants';
import { useAppSelector } from '@/redux/hooks';

const useSetPageTitle = (translationKey: string) => {
	const { translate } = useLanguage();
	const { language } = useAppSelector((state) => state.settings);

	useFocusEffect(
		useCallback(() => {
			if (isWeb) {
				const translatedTitle = translate(translationKey);
				document.title = translatedTitle;
			}
		}, [translationKey, language])
	);
};

export default useSetPageTitle;
