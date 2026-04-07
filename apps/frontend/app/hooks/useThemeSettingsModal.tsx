import React, { useCallback } from 'react';

import ColorSchemeSheet from '@/components/ColorSchemeSheet/ColorSchemeSheet';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';

type ThemeSettingsModalOptions = {
        selectedTheme: string;
        onSelect: (theme: string) => void;
};

export const useThemeSettingsModal = () => {
        const { show: showScrollViewModal, close: closeScrollViewModal } = useMyScrollViewModal();
        const { translate, language } = useLanguage();
        const isRtl = language === 'ar';

        const openThemeSettingsModal = useCallback(
                ({ selectedTheme, onSelect }: ThemeSettingsModalOptions) => {
                        showScrollViewModal(
                                {
                                        title: translate(TranslationKeys.color_scheme),
                                        titleTextAlign: isRtl ? 'right' : 'left',
                                        titleWritingDirection: isRtl ? 'rtl' : 'ltr',
                                        onClose: closeScrollViewModal,
                                        children: (
                                                <ColorSchemeSheet
                                                        closeSheet={closeScrollViewModal}
                                                        selectedTheme={selectedTheme}
                                                        onSelect={onSelect}
                                                />
                                        ),
                                }
                        );
                },
                [closeScrollViewModal, isRtl, showScrollViewModal, translate]
        );

        return { openThemeSettingsModal };
};

export default useThemeSettingsModal;
