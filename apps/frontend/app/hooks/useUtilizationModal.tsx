import React, {useCallback} from 'react';
import ForecastSheet from '@/components/ForecastSheet/ForecastSheet';
import {useMyScrollViewModal} from '@/components/GlobalModal/useMyScrollViewModal';
import {useLanguage} from '@/hooks/useLanguage';
import {TranslationKeys} from '@/locales/keys';
import {DatabaseTypes} from 'repo-depkit-common';
import useIsLtrLanguage from '@/hooks/useIsLtrLanguage';

export const useUtilizationModal = () => {
        const {show: showScrollViewModal, close: closeScrollViewModal} = useMyScrollViewModal();
        const {translate, language} = useLanguage();
        const isLtrLanguage = useIsLtrLanguage();
	const isRtl = !isLtrLanguage;

        const openUtilizationModal = useCallback(
                (forDate: string, canteen: DatabaseTypes.Canteens | null) =>
                        showScrollViewModal(
                                {
                                        title: translate(TranslationKeys.forecast),
                                        titleTextAlign: isRtl ? 'right' : 'left',
                                        titleWritingDirection: isRtl ? 'rtl' : 'ltr',
                                        onClose: closeScrollViewModal,
                                        children: (
                                                <ForecastSheet
                                                        forDate={forDate}
                                                        canteen={canteen}
                                                />
                                        ),
                                },
                                {}
                        ),
                [closeScrollViewModal, isRtl, showScrollViewModal, translate]
        );

        return {openUtilizationModal};
};

export default useUtilizationModal;
