import React, { useCallback } from 'react';

import DrawerPositionSheet from '@/components/DrawerPositionSheet/DrawerPositionSheet';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { TranslationKeys } from '@/locales/keys';

type DrawerPositionModalOptions = {
	selectedPosition: string;
	onSelect: (position: string) => void;
};

export const useDrawerPositionModal = () => {
	const { show: showScrollViewModal, close: closeScrollViewModal } = useMyScrollViewModal();
	const { translate } = useLanguage();
	const { theme } = useTheme();

	const openDrawerPositionModal = useCallback(
		({ selectedPosition, onSelect }: DrawerPositionModalOptions) => {
			showScrollViewModal(
				{
					title: translate(TranslationKeys.drawer_config_position),
					onClose: closeScrollViewModal,
					children: (
						<DrawerPositionSheet
							closeSheet={closeScrollViewModal}
							selectedPosition={selectedPosition}
							onSelect={onSelect}
						/>
					),
				},
				{ backgroundStyle: { backgroundColor: theme.sheet.sheetBg }, headerBackgroundColor: theme.sheet.sheetBg }
			);
		},
		[closeScrollViewModal, showScrollViewModal, theme.sheet.sheetBg, translate]
	);

	return { openDrawerPositionModal };
};

export default useDrawerPositionModal;
