import { useMemo } from 'react';
import * as Localization from 'expo-localization';
import { DateHelper as CommonDateHelper } from 'repo-depkit-common';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';

export const useSmartReadableDateMethod = () => {
	const { translate } = useLanguage();
	const dateLocale = Localization.locale || 'en';

	const relativeDaysDiffTranslations = useMemo(
		() => ({
			[-1]: translate(TranslationKeys.yesterday),
			[0]: translate(TranslationKeys.today),
			[1]: translate(TranslationKeys.tomorrow),
		}),
		[translate]
	);

	return (date: Date) => CommonDateHelper.useSmartReadableDate(date, dateLocale, relativeDaysDiffTranslations);
};
