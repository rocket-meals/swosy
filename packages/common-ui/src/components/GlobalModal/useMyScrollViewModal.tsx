import React, { ReactNode } from 'react';
import MyScrollViewModal, { MyScrollViewModalProps } from '../MyScrollViewModal';
import { useModal } from './useModal';

export type MyScrollViewModalConfig = Omit<MyScrollViewModalProps, 'closeSheet'> & { children?: ReactNode };

type ScrollViewModalOptions = { backgroundStyle?: any; headerBackgroundColor?: string; fullScreen?: boolean };

export const useMyScrollViewModal = () => {
	const { show: showModal, close, showAndDiscardOthers: showAndDiscardOthersModal, closeAll, debug } = useModal();

	const buildArgs = (
		modalProps: MyScrollViewModalConfig,
		options?: ScrollViewModalOptions,
	): [React.ReactElement, ScrollViewModalOptions | undefined] => {
		const { children, backgroundColor, fullScreen, ...restProps } = modalProps;

		const backgroundStyle = backgroundColor
			? { backgroundColor, ...options?.backgroundStyle }
			: options?.backgroundStyle;
		const headerBackgroundColor = backgroundColor ?? options?.headerBackgroundColor;
		const mergedFullScreen = fullScreen ?? options?.fullScreen;
		const mergedOptions: ScrollViewModalOptions = {
			...options,
			backgroundStyle,
			headerBackgroundColor,
			fullScreen: mergedFullScreen,
		};

		const element = (
			<MyScrollViewModal closeSheet={close} backgroundColor={backgroundColor} fullScreen={fullScreen} {...restProps}>
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
