import React, { useCallback } from 'react';

import ColorSchemeSheet from '@/components/ColorSchemeSheet/ColorSchemeSheet';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { TranslationKeys } from '@/locales/keys';

type ThemeSettingsModalOptions = {
        selectedTheme: string;
        onSelect: (theme: string) => void;
};

export const useThemeSettingsModal = () => {
        const { show: showScrollViewModal, close: closeScrollViewModal } = useMyScrollViewModal();
        const { translate } = useLanguage();
        const { theme } = useTheme();

        const openThemeSettingsModal = useCallback(
                ({ selectedTheme, onSelect }: ThemeSettingsModalOptions) => {
                        showScrollViewModal(
                                {
                                        title: translate(TranslationKeys.color_scheme),
                                        onClose: closeScrollViewModal,
                                        children: (
                                                <ColorSchemeSheet
                                                        closeSheet={closeScrollViewModal}
                                                        selectedTheme={selectedTheme}
                                                        onSelect={onSelect}
                                                />
                                        ),
                                },
                                { backgroundStyle: { backgroundColor: theme.sheet.sheetBg }, headerBackgroundColor: theme.sheet.sheetBg }
                        );
                },
                [closeScrollViewModal, showScrollViewModal, theme.sheet.sheetBg, translate]
        );

        return { openThemeSettingsModal };
};

export default useThemeSettingsModal;
