import { ReactNode, useCallback } from 'react';
import { type ModalOptions, useModalContext } from './ModalProvider';

export const useModal = () => {
        const { open, close, debug } = useModalContext();

        const show = useCallback(
                (content: ReactNode, options?: ModalOptions) => {
                        open(content, options);
                },
                [open]
        );

        const closeModal = useCallback(() => {
                close();
        }, [close]);

        return { show, close: closeModal, debug };
};
