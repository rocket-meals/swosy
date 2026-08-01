import React, { createContext, useCallback, useContext, useMemo, useRef, useState, ReactNode } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommonUiComponentIds } from '../../constants/ComponentIds';
import { borderRadiusContainer } from '../../constants/ui';

// ─── Toast (global, short-lived feedback message) ─────────────────────────────
//
// Mount ToastProvider AROUND ModalProvider: its host view is rendered as a
// sibling AFTER the children with a zIndex above the modal container (999, see
// ModalProvider), so a toast triggered from inside a bottom-sheet modal (e.g.
// "copied to clipboard") is visible on top of the open sheet.
//
// Deliberately minimal: one toast at a time (a new show() replaces the current
// one and restarts the timer), fixed position at the top so the keyboard that
// is usually open inside input modals never covers it, and no touch handling -
// the host is pointerEvents="none" and can never block the UI underneath.

export type ToastType = 'success' | 'error' | 'info';

export type ShowToastOptions = {
	type?: ToastType;
	/** How long the toast stays fully visible before fading out. Default 2000ms. */
	durationMs?: number;
};

export type ToastContextType = {
	show: (message: string, options?: ShowToastOptions) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

const DEFAULT_DURATION_MS = 2000;
const FADE_MS = 200;

const TOAST_COLORS: Record<ToastType, string> = {
	success: '#16a34a',
	error: '#dc2626',
	info: '#374151',
};

const TOAST_ICONS: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
	success: 'checkmark-circle',
	error: 'alert-circle',
	info: 'information-circle',
};

type ToastState = {
	message: string;
	type: ToastType;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const [toast, setToast] = useState<ToastState | null>(null);
	const opacity = useRef(new Animated.Value(0)).current;
	const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const insets = useSafeAreaInsets();

	const show = useCallback(
		(message: string, options?: ShowToastOptions) => {
			if (hideTimeoutRef.current) {
				clearTimeout(hideTimeoutRef.current);
				hideTimeoutRef.current = null;
			}
			setToast({ message, type: options?.type ?? 'success' });
			Animated.timing(opacity, { toValue: 1, duration: FADE_MS, useNativeDriver: Platform.OS !== 'web' }).start();
			hideTimeoutRef.current = setTimeout(() => {
				Animated.timing(opacity, { toValue: 0, duration: FADE_MS, useNativeDriver: Platform.OS !== 'web' }).start(
					({ finished }) => {
						// Only unmount if no newer show() has restarted the fade-in meanwhile.
						if (finished) setToast(null);
					},
				);
			}, options?.durationMs ?? DEFAULT_DURATION_MS);
		},
		[opacity],
	);

	const contextValue = useMemo<ToastContextType>(() => ({ show }), [show]);

	return (
		<ToastContext.Provider value={contextValue}>
			{children}
			{toast && (
				<View style={[styles.host, { top: insets.top + 12 }]} pointerEvents="none">
					<Animated.View
						nativeID={CommonUiComponentIds.TOAST}
						style={[styles.toast, { backgroundColor: TOAST_COLORS[toast.type], opacity }]}
					>
						<Ionicons name={TOAST_ICONS[toast.type]} size={18} color="#ffffff" />
						<Text style={styles.toastText} numberOfLines={3}>
							{toast.message}
						</Text>
					</Animated.View>
				</View>
			)}
		</ToastContext.Provider>
	);
};

export const useToast = (): ToastContextType => {
	const ctx = useContext(ToastContext);
	if (!ctx) throw new Error('useToast must be used within a ToastProvider');
	return ctx;
};

const styles = StyleSheet.create({
	host: {
		position: 'absolute',
		left: 0,
		right: 0,
		alignItems: 'center',
		// Above the modal container (zIndex 999 in ModalProvider), so toasts
		// triggered from inside a bottom-sheet modal stay visible.
		zIndex: 2000,
		elevation: 2000,
	},
	toast: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		maxWidth: '90%',
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: borderRadiusContainer,
		shadowColor: '#000000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 6,
	},
	toastText: {
		color: '#ffffff',
		fontSize: 14,
		fontWeight: '600',
		flexShrink: 1,
	},
});
