import React, { createContext, useContext, useState, ReactNode, useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import BaseBottomSheet from '@/components/BaseBottomSheet/BaseBottomSheet';

type ModalContextType = {
        open: (content: ReactNode, options?: { backgroundStyle?: any }) => void;
        close: () => void;
        debug: {
                lastAction: 'open' | 'close' | null;
                contentSet: boolean;
                backgroundStyleProvided: boolean;
                sheetRefReady: boolean;
                openInvocations: number;
                closeInvocations: number;
        };
};

const ModalContext = createContext<ModalContextType | null>(null);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
        const [content, setContent] = useState<ReactNode | null>(null);
        const [backgroundStyle, setBackgroundStyle] = useState<any>(null);
        const sheetRef = useRef<any>(null);
        const [isVisible, setIsVisible] = useState(false);
        const [debug, setDebug] = useState<ModalContextType['debug']>({
                lastAction: null,
                contentSet: false,
                backgroundStyleProvided: false,
                sheetRefReady: false,
                openInvocations: 0,
                closeInvocations: 0,
        });

        const open = (c: ReactNode, options?: { backgroundStyle?: any }) => {
                setContent(c);
                setBackgroundStyle(options?.backgroundStyle ?? null);
                setIsVisible(true);
                setDebug((prev) => ({
                        ...prev,
                        lastAction: 'open',
                        contentSet: Boolean(c),
                        backgroundStyleProvided: Boolean(options?.backgroundStyle),
                        sheetRefReady: Boolean(sheetRef.current),
                        openInvocations: prev.openInvocations + 1,
                }));
        };

        const close = () => {
                sheetRef.current?.close?.();
                setBackgroundStyle(null);
                setTimeout(() => {
                        setContent(null);
                        setIsVisible(false);
                }, 200);
                setDebug((prev) => ({
                        ...prev,
                        lastAction: 'close',
                        contentSet: false,
                        sheetRefReady: Boolean(sheetRef.current),
                        closeInvocations: prev.closeInvocations + 1,
                }));
        };

        // When content is set, ensure the sheet expands once the sheet ref is available
        useEffect(() => {
                if (!content) return;
                // small timeout to allow ref attachment/render
                const t = setTimeout(() => {
                        sheetRef.current?.expand?.();
                        setDebug((prev) => ({
                                ...prev,
                                sheetRefReady: Boolean(sheetRef.current),
                        }));
                }, 20);
                return () => clearTimeout(t);
        }, [content]);

        // Also react to visibility changes in case the content does not change (e.g., re-open same modal)
        useEffect(() => {
                if (isVisible) {
                        sheetRef.current?.expand?.();
                        setDebug((prev) => ({
                                ...prev,
                                sheetRefReady: Boolean(sheetRef.current),
                        }));
                } else {
                        sheetRef.current?.close?.();
                }
        }, [isVisible]);

        return (
                <ModalContext.Provider value={{ open, close, debug }}>
                        {children}
                        <View pointerEvents="box-none" style={styles.modalContainer}>
                                <BaseBottomSheet
                                        ref={sheetRef}
                                        index={isVisible ? 0 : -1}
                                        backgroundStyle={backgroundStyle}
                                        enablePanDownToClose
                                        onClose={() => {
                                                setContent(null);
                                                setBackgroundStyle(null);
                                                setIsVisible(false);
                                                setDebug((prev) => ({
                                                        ...prev,
                                                        lastAction: 'close',
                                                        contentSet: false,
                                                        sheetRefReady: Boolean(sheetRef.current),
                                                        closeInvocations: prev.closeInvocations + 1,
                                                }));
                                        }}
                                >
                                        {content}
                                </BaseBottomSheet>
                        </View>
                </ModalContext.Provider>
        );
};

export const useModalContext = () => {
        const ctx = useContext(ModalContext);
        if (!ctx) throw new Error('useModalContext must be used within a ModalProvider');
        return ctx;
};

const styles = StyleSheet.create({
        modalContainer: {
                ...StyleSheet.absoluteFillObject,
                zIndex: 999,
        },
});
