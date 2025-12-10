import { ReactNode, useCallback } from 'react';
import { useModalContext } from './ModalProvider';

export const useModal = () => {
        const { open, close, debug } = useModalContext();

        const show = useCallback(
                (content: ReactNode, options?: { backgroundStyle?: any }) => {
                        open(content, options);
                },
                [open]
        );

        const closeModal = useCallback(() => {
                close();
        }, [close]);

        return { show, close: closeModal, debug };
};

