import { ReactNode } from 'react';
import MyScrollViewModal, { MyScrollViewModalProps } from '@/components/MyScrollViewModal';
import { useModal } from './useModal';
import { useTheme } from '@/hooks/useTheme';
import {View} from "react-native";
import React from 'react';

export type MyScrollViewModalConfig = Omit<MyScrollViewModalProps, 'closeSheet'> & { children?: ReactNode };

export const useMyScrollViewModal = () => {
        const { show: showModal, close, debug } = useModal();
        const { theme } = useTheme();

        const show = (modalProps: MyScrollViewModalConfig, options?: { backgroundStyle?: any; headerBackgroundColor?: string }) => {
                const { children, backgroundColor, ...restProps } = modalProps;

                const themeDrivenBackground = backgroundColor == null && options?.backgroundStyle?.backgroundColor == null;
                const resolvedBackgroundColor =
                        options?.backgroundStyle?.backgroundColor ?? backgroundColor ?? theme.screen.background;
                const backgroundStyle = { ...options?.backgroundStyle, backgroundColor: resolvedBackgroundColor };
                const modalBackgroundColor = themeDrivenBackground ? undefined : resolvedBackgroundColor;

                const mergedOptions = {
                        ...options,
                        backgroundStyle,
                        headerBackgroundColor: resolvedBackgroundColor,
                        useThemeBackground: themeDrivenBackground,
                        useThemeHeaderBackground: themeDrivenBackground,
                };

                showModal(
                        <MyScrollViewModal closeSheet={close} backgroundColor={modalBackgroundColor} {...restProps}>
                                {children}
                        </MyScrollViewModal>,
                        mergedOptions,
                );
        };

        return { show, close, debug };
};
