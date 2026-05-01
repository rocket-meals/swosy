import React, { useCallback } from 'react';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import { HoursSheetContent } from '@/components/HoursSheet/HoursSheet';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import useIsLtrLanguage from '@/hooks/useIsLtrLanguage';

export const useMyScrollviewModalBusinessHours = () => {
	const { show: showScrollViewModal, close: closeScrollViewModal } = useMyScrollViewModal();
	const { translate, language } = useLanguage();
	const isLtrLanguage = useIsLtrLanguage();
	const isRtl = !isLtrLanguage;

	const openBusinessHoursModal = useCallback(() => {
		showScrollViewModal({
			title: translate(TranslationKeys.businesshours),
			titleTextAlign: isRtl ? 'right' : 'left',
			titleWritingDirection: isRtl ? 'rtl' : 'ltr',
			children: <HoursSheetContent />,
		});
	}, [closeScrollViewModal, isRtl, showScrollViewModal, translate]);

	return { openBusinessHoursModal, closeBusinessHoursModal: closeScrollViewModal };
};

export default useMyScrollviewModalBusinessHours;
