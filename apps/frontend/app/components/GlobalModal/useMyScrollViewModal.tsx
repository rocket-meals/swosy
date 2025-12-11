import { ReactNode } from 'react';
import MyScrollViewModal, { MyScrollViewModalProps } from '@/components/MyScrollViewModal';
import { useModal } from './useModal';
import { useTheme } from '@/hooks/useTheme';

export type MyScrollViewModalConfig = Omit<MyScrollViewModalProps, 'closeSheet'> & { children?: ReactNode };

export const useMyScrollViewModal = () => {
        const { show: showModal, close, debug } = useModal();
        const { theme } = useTheme();

        const show = (modalProps: MyScrollViewModalConfig, options?: { backgroundStyle?: any }) => {
                const { children, ...restProps } = modalProps;

                const mergedOptions = {
                        ...options,
                        backgroundStyle: { backgroundColor: theme.screen.background, ...options?.backgroundStyle },
                };

                showModal(
                        <MyScrollViewModal closeSheet={close} {...restProps}>
                                {children}
                        </MyScrollViewModal>,
                        mergedOptions,
                );
        };

        return { show, close, debug };
};
