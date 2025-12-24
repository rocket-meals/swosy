import React, { useCallback } from 'react';

import AmountColumnSheet from '@/components/AmountColumnSheet/AmountColumnSheet';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { TranslationKeys } from '@/locales/keys';

type AmountColumnModalOptions = {
	selectedAmount: number;
	onSelect: (amount: number) => void;
};

export const useAmountColumnModal = () => {
	const { show: showScrollViewModal, close: closeScrollViewModal } = useMyScrollViewModal();
	const { translate } = useLanguage();
	const { theme } = useTheme();

	const openAmountColumnModal = useCallback(
		({ selectedAmount, onSelect }: AmountColumnModalOptions) => {
			showScrollViewModal(
				{
					title: translate(TranslationKeys.amount_columns_for_cards),
					onClose: closeScrollViewModal,
					children: (
						<AmountColumnSheet
							closeSheet={closeScrollViewModal}
							selectedAmount={selectedAmount}
							onSelect={onSelect}
						/>
					),
				},
				{ backgroundStyle: { backgroundColor: theme.sheet.sheetBg }, headerBackgroundColor: theme.sheet.sheetBg }
			);
		},
		[closeScrollViewModal, showScrollViewModal, theme.sheet.sheetBg, translate]
	);

	return { openAmountColumnModal };
};

export default useAmountColumnModal;
