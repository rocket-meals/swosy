import React, { useCallback } from 'react';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import AccountBalanceScreen from '@/app/(app)/account-balance';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';

const useAccountBalanceModal = () => {
	const { show, close } = useMyScrollViewModal();
	const { translate } = useLanguage();

	const openAccountBalanceModal = useCallback(
		(autoStartNfc: boolean = false) => {
			show({
				title: translate(TranslationKeys.accountbalance),
				children: <AccountBalanceScreen autoStartNfc={autoStartNfc} />,
				disableHorizontalPadding: true,
			});
		},
		[show, translate]
	);

	return { openAccountBalanceModal, closeAccountBalanceModal: close };
};

export default useAccountBalanceModal;
