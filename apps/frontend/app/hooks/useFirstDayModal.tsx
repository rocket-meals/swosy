import React, { useCallback } from 'react';

import FirstDaySheet from '@/components/FirstDaySheet/FirstDaySheet';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { TranslationKeys } from '@/locales/keys';

type FirstDayModalOptions = {
	selectedDay: string;
	onSelect: (day: { id: string; name: string }) => void;
};

export const useFirstDayModal = () => {
	const { show: showScrollViewModal, close: closeScrollViewModal } = useMyScrollViewModal();
	const { translate } = useLanguage();
	const { theme } = useTheme();

	const openFirstDayModal = useCallback(
		({ selectedDay, onSelect }: FirstDayModalOptions) => {
			showScrollViewModal(
				{
					title: translate(TranslationKeys.first_day_of_week),
					onClose: closeScrollViewModal,
					children: (
						<FirstDaySheet
							closeSheet={closeScrollViewModal}
							selectedDay={selectedDay}
							onSelect={onSelect}
						/>
					),
				},
				{ backgroundStyle: { backgroundColor: theme.sheet.sheetBg }, headerBackgroundColor: theme.sheet.sheetBg }
			);
		},
		[closeScrollViewModal, showScrollViewModal, theme.sheet.sheetBg, translate]
	);

	return { openFirstDayModal };
};

export default useFirstDayModal;
