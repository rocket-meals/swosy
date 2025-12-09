import { ReactNode } from 'react';
import { useModalContext } from './ModalProvider';

export const useModal = () => {
        const { open, close, debug } = useModalContext();

        const show = (content: ReactNode, options?: { backgroundStyle?: any }) => {
                open(content, options);
        };

        const closeModal = () => {
                close();
        };

        return { show, close: closeModal, debug };
};

