import React, { ReactNode } from 'react';
import MyScrollViewModal, { MyScrollViewModalProps } from '@/components/MyScrollViewModal';
import { useModal } from './useModal';
import type { ModalCloseReason } from 'repo-depkit-common-ui';

export type MyScrollViewModalConfig = MyScrollViewModalProps & { children?: ReactNode };

type ScrollViewModalOptions = {
	backgroundStyle?: any;
	headerBackgroundColor?: string;
	/** Forwarded to the global modal stack - see ModalOptions.onClosed in repo-depkit-common-ui. */
	onClosed?: (reason: ModalCloseReason) => void;
};

export const useMyScrollViewModal = () => {
        const { show: showModal, close, showAndDiscardOthers: showAndDiscardOthersModal, closeAll, debug } = useModal();

        const buildArgs = (
                modalProps: MyScrollViewModalConfig,
                options?: ScrollViewModalOptions,
        ): [React.ReactElement, ScrollViewModalOptions | undefined] => {
                const { children, backgroundColor, ...restProps } = modalProps;

                const backgroundStyle = backgroundColor
                        ? { backgroundColor, ...options?.backgroundStyle }
                        : options?.backgroundStyle;
                const headerBackgroundColor = backgroundColor ?? options?.headerBackgroundColor;
                const mergedOptions = options
                        ? {
                                  ...options,
                                  backgroundStyle,
                                  headerBackgroundColor,
                          }
                        : undefined;

                const element = (
                        <MyScrollViewModal backgroundColor={backgroundColor} {...restProps}>
                                {children}
                        </MyScrollViewModal>
                );

                return [element, mergedOptions];
        };

        const show = (modalProps: MyScrollViewModalConfig, options?: ScrollViewModalOptions) => {
                const [element, mergedOptions] = buildArgs(modalProps, options);
                showModal(element, mergedOptions);
        };

        const showAndDiscardOthers = (modalProps: MyScrollViewModalConfig, options?: ScrollViewModalOptions) => {
                const [element, mergedOptions] = buildArgs(modalProps, options);
                showAndDiscardOthersModal(element, mergedOptions);
        };

        return { show, close, showAndDiscardOthers, closeAll, debug };
};
