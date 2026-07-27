import React, { ReactNode } from 'react';
import MyScrollViewModal, { MyScrollViewModalProps } from '../MyScrollViewModal';
import { useModal } from './useModal';
import type { ModalCloseReason } from './ModalProvider';

export type MyScrollViewModalConfig = MyScrollViewModalProps & { children?: ReactNode };

type ScrollViewModalOptions = {
	backgroundStyle?: any;
	headerBackgroundColor?: string;
	/**
	 * Called exactly once when this modal leaves the stack - including when it
	 * is only popped back to the modal below it.
	 *
	 * Prefer this over `MyScrollViewModalProps.onClose` for anything that has
	 * to happen on close (e.g. persisting what the user edited): `onClose`
	 * fires from the content component's unmount, and the stack renders every
	 * item at the same tree position inside one sheet - so popping back to the
	 * parent modal re-renders that component instead of unmounting it, and
	 * `onClose` never runs (see the SCROLL FIX 6 note in MyScrollViewModal).
	 */
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
		const mergedOptions: ScrollViewModalOptions = {
			...options,
			backgroundStyle,
			headerBackgroundColor,
		};

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
