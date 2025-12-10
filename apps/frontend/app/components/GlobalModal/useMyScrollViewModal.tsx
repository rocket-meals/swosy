import { ReactNode } from 'react';
import MyScrollViewModal, { MyScrollViewModalProps } from '@/components/MyScrollViewModal';
import { useModal } from './useModal';

export type MyScrollViewModalConfig = Omit<MyScrollViewModalProps, 'closeSheet'> & { children?: ReactNode };

export const useMyScrollViewModal = () => {
        const { show: showModal, close, debug } = useModal();

        const show = (modalProps: MyScrollViewModalConfig, options?: { backgroundStyle?: any }) => {
                const { children, ...restProps } = modalProps;

                showModal(
                        <MyScrollViewModal closeSheet={close} {...restProps}>
                                {children}
                        </MyScrollViewModal>,
                        options,
                );
        };

        return { show, close, debug };
};
