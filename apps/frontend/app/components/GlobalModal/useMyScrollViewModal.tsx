import { ReactNode } from 'react';
import MyScrollViewModal, { MyScrollViewModalProps } from '@/components/MyScrollViewModal';
import { useModal } from './useModal';
import { useTheme } from '@/hooks/useTheme';
import {View} from "react-native";
import React from 'react';
import { ThemeBackgroundSource } from './ModalProvider';

export type MyScrollViewModalConfig = Omit<MyScrollViewModalProps, 'closeSheet'> & { children?: ReactNode };

export const useMyScrollViewModal = () => {
        const { show: showModal, close, debug } = useModal();
        const { theme } = useTheme();

        const show = (modalProps: MyScrollViewModalConfig, options?: { backgroundStyle?: any; headerBackgroundColor?: string }) => {
                const { children, backgroundColor, ...restProps } = modalProps;

                let themeBackgroundSource: ThemeBackgroundSource | undefined;
                if (backgroundColor == null && options?.backgroundStyle?.backgroundColor == null) {
                        themeBackgroundSource = 'screen';
                } else if (options?.backgroundStyle?.backgroundColor === theme.sheet.sheetBg || backgroundColor === theme.sheet.sheetBg) {
                        themeBackgroundSource = 'sheet';
                } else if (
                        options?.backgroundStyle?.backgroundColor === theme.screen.background ||
                        backgroundColor === theme.screen.background
                ) {
                        themeBackgroundSource = 'screen';
                }

                const themeDrivenBackground = Boolean(themeBackgroundSource);
                const resolvedBackgroundColor = themeDrivenBackground
                        ? themeBackgroundSource === 'sheet'
                                ? theme.sheet.sheetBg
                                : theme.screen.background
                        : options?.backgroundStyle?.backgroundColor ?? backgroundColor ?? theme.screen.background;
                const backgroundStyle = { ...options?.backgroundStyle, backgroundColor: resolvedBackgroundColor };
                const modalBackgroundColor = themeDrivenBackground ? undefined : resolvedBackgroundColor;

                const mergedOptions = {
                        ...options,
                        backgroundStyle,
                        headerBackgroundColor: resolvedBackgroundColor,
                        useThemeBackground: themeDrivenBackground,
                        useThemeHeaderBackground: themeDrivenBackground,
                        themeBackgroundSource,
                        themeHeaderBackgroundSource: themeBackgroundSource,
                };

                showModal(
                        <MyScrollViewModal
                                closeSheet={close}
                                backgroundColor={modalBackgroundColor}
                                backgroundColorSource={themeBackgroundSource}
                                {...restProps}
                        >
                                {children}
                        </MyScrollViewModal>,
                        mergedOptions,
                );
        };

        return { show, close, debug };
};
