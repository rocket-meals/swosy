import { ReactNode } from 'react';
import MyScrollViewModal, { MyScrollViewModalProps } from '@/components/MyScrollViewModal';
import { useModal } from './useModal';
import { type ModalOptions } from './ModalProvider';
import { useTheme } from '@/hooks/useTheme';
import React from 'react';

export type MyScrollViewModalConfig = Omit<MyScrollViewModalProps, 'closeSheet'> & { children?: ReactNode };

const resolveThemedColor = (color: string | undefined, theme: any) => {
        if (!color) return undefined;
        if (color === theme.sheet.sheetBg) return (activeTheme: any) => activeTheme.sheet.sheetBg;
        if (color === theme.screen.background) return (activeTheme: any) => activeTheme.screen.background;
        return color;
};

const resolveThemedBackgroundStyle = (style: any, theme: any) => {
        if (!style?.backgroundColor) return style;
        if (style.backgroundColor === theme.sheet.sheetBg) {
                return (activeTheme: any) => ({ ...style, backgroundColor: activeTheme.sheet.sheetBg });
        }
        if (style.backgroundColor === theme.screen.background) {
                return (activeTheme: any) => ({ ...style, backgroundColor: activeTheme.screen.background });
        }
        return style;
};

export const useMyScrollViewModal = () => {
        const { show: showModal, close, debug } = useModal();
        const { theme } = useTheme();

        const show = (modalProps: MyScrollViewModalConfig, options?: ModalOptions) => {
                const { children, backgroundColor, ...restProps } = modalProps;

                const themedBackgroundStyle = resolveThemedBackgroundStyle(options?.backgroundStyle, theme);
                const themedHeaderBackgroundColor = resolveThemedColor(options?.headerBackgroundColor ?? backgroundColor, theme);

                const mergedOptions = {
                        ...options,
                        backgroundStyle: themedBackgroundStyle,
                        headerBackgroundColor: themedHeaderBackgroundColor,
                };

                showModal(
                        <MyScrollViewModal closeSheet={close} backgroundColor={backgroundColor} {...restProps}>
                                {children}
                        </MyScrollViewModal>,
                        mergedOptions,
                );
        };

        return { show, close, debug };
};
