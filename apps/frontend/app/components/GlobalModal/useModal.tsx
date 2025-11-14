import { ReactNode } from 'react';
import { useModalContext } from './ModalProvider';

export const useModal = () => {
	const { open, close } = useModalContext();

	const show = (content: ReactNode, options?: { backgroundStyle?: any }) => {
		open(content, options);
	};

	return { show, close };
};

