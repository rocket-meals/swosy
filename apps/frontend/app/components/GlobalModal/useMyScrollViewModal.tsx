import { ReactNode } from 'react';
import MyScrollViewModal, { MyScrollViewModalProps } from '@/components/MyScrollViewModal';
import { useModal } from './useModal';

export type MyScrollViewModalConfig = Omit<MyScrollViewModalProps, 'closeSheet'> & { children?: ReactNode };

export const useMyScrollViewModal = () => {
        const { show: showModal, close, debug } = useModal();

        const show = (modalProps: MyScrollViewModalConfig, options?: { backgroundStyle?: any; headerBackgroundColor?: string }) => {
                const { children, backgroundColor, ...restProps } = modalProps;
                const resolvedBackgroundColor = backgroundColor ?? undefined;
                const backgroundStyle = resolvedBackgroundColor
                        ? { backgroundColor: resolvedBackgroundColor, ...options?.backgroundStyle }
                        : options?.backgroundStyle;

                const headerBackgroundColor = options?.headerBackgroundColor ?? resolvedBackgroundColor;

                const mergedOptions = {
                        ...options,
                        ...(backgroundStyle ? { backgroundStyle } : {}),
                        ...(headerBackgroundColor ? { headerBackgroundColor } : {}),
                };

                showModal(
                        <MyScrollViewModal closeSheet={close} backgroundColor={resolvedBackgroundColor} {...restProps}>
                                {children}
                        </MyScrollViewModal>,
                        mergedOptions,
                );
        };

        return { show, close, debug };
};
