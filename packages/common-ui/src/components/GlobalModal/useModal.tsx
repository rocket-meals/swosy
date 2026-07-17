import { ReactNode, useCallback } from 'react';
import { useModalContext } from './ModalProvider';
import type { ModalOptions } from './ModalProvider';

export const useModal = () => {
	const { open, close, openAndDiscardOthers, closeAll, debug } = useModalContext();

	const show = useCallback(
		(content: ReactNode, options?: ModalOptions) => {
			open(content, options);
		},
		[open],
	);

	const closeModal = useCallback(() => {
		close();
	}, [close]);

	const showAndDiscardOthers = useCallback(
		(content: ReactNode, options?: ModalOptions) => {
			openAndDiscardOthers(content, options);
		},
		[openAndDiscardOthers],
	);

	const closeAllModals = useCallback(() => {
		closeAll();
	}, [closeAll]);

	return { show, close: closeModal, showAndDiscardOthers, closeAll: closeAllModals, debug };
};
