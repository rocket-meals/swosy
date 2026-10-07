import { useMemo } from 'react';
import type { MyCalendarMonthTexts, MyColorSelectionTexts } from 'repo-depkit-common-ui';
import { useAppSelector } from '@/redux/hooks';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';

const WEEKDAY_INDEX: Record<string, number> = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };

/** Translated `texts` for the language-agnostic common-ui calendar and color selection. */
export default function useCommonUiTexts() {
	const { translate } = useLanguage();
	const firstDayOfTheWeek = useAppSelector(state => state.settings.firstDayOfTheWeek);

	const calendarMonthTexts: MyCalendarMonthTexts = useMemo(
		() => ({
			monthNames: [TranslationKeys.January, TranslationKeys.February, TranslationKeys.March, TranslationKeys.April, TranslationKeys.May, TranslationKeys.June, TranslationKeys.July, TranslationKeys.August, TranslationKeys.September, TranslationKeys.October, TranslationKeys.November, TranslationKeys.December].map(key => translate(key)),
			weekdayShortNames: [TranslationKeys.Sun_S, TranslationKeys.Mon_S, TranslationKeys.Tue_S, TranslationKeys.Wed_S, TranslationKeys.Thu_S, TranslationKeys.Fri_S, TranslationKeys.Sat_S].map(key => translate(key)),
			previousMonth: translate(TranslationKeys.previous_month),
			nextMonth: translate(TranslationKeys.next_month),
		}),
		[translate]
	);

	const colorSelectionTexts: MyColorSelectionTexts = useMemo(
		() => ({
			customColorTitle: translate(TranslationKeys.avatar_section_custom_color),
			useCustomColor: translate(TranslationKeys.avatar_use_custom_color),
			presetsTitle: translate(TranslationKeys.avatar_section_preset_colors),
		}),
		[translate]
	);

	const firstDayOfWeek = WEEKDAY_INDEX[firstDayOfTheWeek?.id ?? 'monday'] ?? 1;

	return { calendarMonthTexts, colorSelectionTexts, firstDayOfWeek };
}
