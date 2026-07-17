import React, { createContext, useCallback, useContext, useState, ReactNode, useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import BaseBottomSheet from '../BaseBottomSheet';
import { useTheme } from '../../context/ThemeContext';

type ModalOptions = {
	backgroundStyle?: any;
	headerBackgroundColor?: string;
	overlayStyle?: any;
};

type ModalStackItem = {
	content: ReactNode;
	backgroundStyle: any;
	overlayStyle: any;
	headerBackgroundColor: string | undefined;
};

type ModalContextType = {
	open: (content: ReactNode, options?: ModalOptions) => void;
	close: () => void;
	openAndDiscardOthers: (content: ReactNode, options?: ModalOptions) => void;
	closeAll: () => void;
	debug: {
		lastAction: 'open' | 'close' | null;
		contentSet: boolean;
		backgroundStyleProvided: boolean;
		sheetRefReady: boolean;
		openInvocations: number;
		closeInvocations: number;
	};
	/** @internal used by ModalRenderer */
	_currentItem: ModalStackItem | null;
	/** @internal used by ModalRenderer */
	_sheetRef: React.MutableRefObject<any>;
	/** @internal used by ModalRenderer */
	_handleSheetChange: (index: number) => void;
	/** @internal used by ModalRenderer */
	_screenBackgroundColor: string;
	/** @internal used by ModalRenderer - how many modals are stacked, to decide whether the header button shows a back-chevron (stack) or an X (single modal) */
	_stackDepth: number;
};

const ModalContext = createContext<ModalContextType | null>(null);

const CLOSE_GUARD_RESET_DELAY_MS = 150;
const POP_DEBOUNCE_MS = 300;
// Generous safety net in case the sheet's own onChange(-1) confirmation (see
// handleSheetChange) never fires - e.g. the native ref wasn't attached. Real close
// animations settle in well under a second, so this should never race that real
// confirmation; it only exists to guarantee we don't get stuck if it's missing.
const CLOSE_CONFIRMATION_FALLBACK_MS = 1500;

export const ModalContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const [modalStack, setModalStack] = useState<ModalStackItem[]>([]);
	const modalStackRef = useRef<ModalStackItem[]>([]);

	const sheetRef = useRef<any>(null);
	const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	// True from the moment the sheet is asked to close - via close()/closeAll(), or via
	// BaseBottomSheet's onDismissAll/onClose reacting to a user gesture - until the sheet's
	// onChange confirms index -1 was actually reached. Finalizing (clearing modalStack) only
	// ever happens in reaction to that real confirmation - never on a guessed timeout - so a
	// next event can never be opened while the previous one's close animation is still
	// in flight, and there's nothing stale left to race it.
	const isClosingRef = useRef(false);

	const { theme } = useTheme();

	const [debug, setDebug] = useState<ModalContextType['debug']>({
		lastAction: null,
		contentSet: false,
		backgroundStyleProvided: false,
		sheetRefReady: false,
		openInvocations: 0,
		closeInvocations: 0,
	});

	const clearCloseTimeout = () => {
		if (closeTimeoutRef.current) {
			clearTimeout(closeTimeoutRef.current);
			closeTimeoutRef.current = null;
		}
	};

	const open = (c: ReactNode, options?: ModalOptions) => {
		clearCloseTimeout();
		isClosingRef.current = false;

		const newItem: ModalStackItem = {
			content: c,
			backgroundStyle: options?.backgroundStyle ?? null,
			overlayStyle: options?.overlayStyle ?? { backgroundColor: 'rgba(0,0,0,0.5)' },
			headerBackgroundColor:
				options?.headerBackgroundColor ?? options?.backgroundStyle?.backgroundColor ?? undefined,
		};

		modalStackRef.current = [...modalStackRef.current, newItem];
		setModalStack([...modalStackRef.current]);
		setOpenCount(c => c + 1);

		setDebug(prev => ({
			...prev,
			lastAction: 'open',
			contentSet: true,
			backgroundStyleProvided: Boolean(options?.backgroundStyle),
			sheetRefReady: Boolean(sheetRef.current),
			openInvocations: prev.openInvocations + 1,
		}));
	};

	const openAndDiscardOthers = (c: ReactNode, options?: ModalOptions) => {
		clearCloseTimeout();
		isClosingRef.current = false;

		const newItem: ModalStackItem = {
			content: c,
			backgroundStyle: options?.backgroundStyle ?? null,
			overlayStyle: options?.overlayStyle ?? { backgroundColor: 'rgba(0,0,0,0.5)' },
			headerBackgroundColor:
				options?.headerBackgroundColor ?? options?.backgroundStyle?.backgroundColor ?? undefined,
		};

		modalStackRef.current = [newItem];
		setModalStack([newItem]);
		setOpenCount(c => c + 1);

		setDebug(prev => ({
			...prev,
			lastAction: 'open',
			contentSet: true,
			backgroundStyleProvided: Boolean(options?.backgroundStyle),
			sheetRefReady: Boolean(sheetRef.current),
			openInvocations: prev.openInvocations + 1,
		}));
	};

	const closeAll = () => {
		if (modalStackRef.current.length === 0) return;
		if (isClosingRef.current) return;
		isClosingRef.current = true;

		modalStackRef.current = [];
		sheetRef.current?.close?.();
		clearCloseTimeout();
		closeTimeoutRef.current = setTimeout(() => {
			isClosingRef.current = false;
			setModalStack([]);
			clearCloseTimeout();
		}, CLOSE_CONFIRMATION_FALLBACK_MS);

		setDebug(prev => ({
			...prev,
			lastAction: 'close',
			contentSet: false,
			sheetRefReady: Boolean(sheetRef.current),
			closeInvocations: prev.closeInvocations + 1,
		}));
	};

	const close = () => {
		if (modalStackRef.current.length === 0) return;
		if (isClosingRef.current) return;
		isClosingRef.current = true;

		if (modalStackRef.current.length === 1) {
			// Ask the sheet to close, but don't touch modalStack (React state) yet -
			// handleSheetChange finalizes it once the sheet's onChange confirms index -1
			// was actually reached, whether that's from this call or a user gesture.
			modalStackRef.current = [];
			sheetRef.current?.close?.();
			clearCloseTimeout();
			closeTimeoutRef.current = setTimeout(() => {
				isClosingRef.current = false;
				setModalStack([]);
				clearCloseTimeout();
			}, CLOSE_CONFIRMATION_FALLBACK_MS);
		} else {
			// No native close animation to wait for here - just swap back to the
			// previous stack item, which stays open throughout.
			modalStackRef.current = modalStackRef.current.slice(0, -1);
			setModalStack([...modalStackRef.current]);
			clearCloseTimeout();
			closeTimeoutRef.current = setTimeout(() => {
				isClosingRef.current = false;
				clearCloseTimeout();
			}, POP_DEBOUNCE_MS);
		}

		setDebug(prev => ({
			...prev,
			lastAction: 'close',
			contentSet: modalStackRef.current.length > 0,
			sheetRefReady: Boolean(sheetRef.current),
			closeInvocations: prev.closeInvocations + 1,
		}));
	};

	// Desired dismiss behaviour (see BaseBottomSheetProps for the matching prop docs): a
	// backdrop tap or a swipe-down-to-close gesture is a "get me out of here" gesture from
	// the user, independent of how many modals are stacked - both dismiss the ENTIRE stack
	// via onDismissAll/closeAll, called directly by BaseBottomSheet before this onChange
	// handler runs for index === -1. Only the header close/back button steps back one level
	// via onClose/close(). Either way, by the time this sees index === -1 for a real close
	// (as opposed to some other caller's stray/aborted transition), isClosingRef is already
	// true - that's the actual confirmation the close animation finished, so only now is it
	// safe to finalize (unmount the sheet's content) rather than guessing at its timing.
	const handleSheetChange = useCallback((index: number) => {
		if (index >= 0) {
			if (isClosingRef.current) {
				// The sheet snapped back open instead of finishing a close - treat it as
				// cancelled rather than leaving a close "confirmed" later for the wrong item.
				isClosingRef.current = false;
				clearCloseTimeout();
			}
			return;
		}

		if (index === -1) {
			if (isClosingRef.current) {
				// Real confirmation that the close animation actually finished - only now
				// is it safe to finalize (unmount the sheet's content).
				isClosingRef.current = false;
				clearCloseTimeout();
				setModalStack([]);
			} else if (modalStackRef.current.length > 0) {
				// Closed without us asking for it while something should still be shown -
				// snap back open.
				sheetRef.current?.expand?.();
			}
		}
	}, []);

	const ensureExpand = () => {
		let tries = 0;
		let cancelled = false;
		const attempt = () => {
			if (cancelled) return;
			try {
				if (sheetRef.current?.expand) {
					sheetRef.current.expand();
					setDebug((prev) => ({
						...prev,
						sheetRefReady: Boolean(sheetRef.current),
					}));
					return;
				}
			} catch (e) {
				// ignore occasional errors from exotic refs
			}
			tries += 1;
			if (tries < 60) {
				if (typeof requestAnimationFrame !== 'undefined') {
					requestAnimationFrame(attempt);
				} else {
					setTimeout(attempt, 16);
				}
			}
		};
		attempt();
		return () => {
			cancelled = true;
		};
	};

	const [openCount, setOpenCount] = useState(0);

	useEffect(() => {
		if (openCount > 0 && modalStack.length > 0) {
			const cancel = ensureExpand();
			return () => cancel();
		}
	}, [openCount]);

	const currentItem = modalStack[modalStack.length - 1] ?? null;
	const screenBackgroundColor = currentItem?.headerBackgroundColor || theme.screen.background;

	return (
		<ModalContext.Provider value={{
			open, close, openAndDiscardOthers, closeAll, debug,
			_currentItem: currentItem,
			_sheetRef: sheetRef,
			_handleSheetChange: handleSheetChange,
			_screenBackgroundColor: screenBackgroundColor,
			_stackDepth: modalStack.length,
		}}>
			{children}
		</ModalContext.Provider>
	);
};

export const ModalRenderer: React.FC<{ children: ReactNode }> = ({ children }) => {
	const {
		_currentItem: currentItem,
		_sheetRef: sheetRef,
		_handleSheetChange: handleSheetChange,
		_screenBackgroundColor: screenBackgroundColor,
		_stackDepth: stackDepth,
		close,
		closeAll,
	} = useModalContext();

	return (
		<>
			{children}
			{currentItem && (
				<View style={styles.modalContainer} pointerEvents="box-none">
					<View
						style={[StyleSheet.absoluteFillObject, currentItem.overlayStyle ?? { backgroundColor: 'rgba(0,0,0,0.5)' }]}
						pointerEvents="none"
					/>
					<BaseBottomSheet
						ref={sheetRef}
						enablePanDownToClose
						onClose={close}
						onDismissAll={closeAll}
						showBackChevron={stackDepth > 1}
						onChange={handleSheetChange}
						headerBackgroundColor={screenBackgroundColor}
						backgroundStyle={currentItem.backgroundStyle}
					>
						{currentItem.content}
					</BaseBottomSheet>
				</View>
			)}
		</>
	);
};

/** Convenience wrapper that combines ModalContextProvider + ModalRenderer. */
export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => (
	<ModalContextProvider>
		<ModalRenderer>{children}</ModalRenderer>
	</ModalContextProvider>
);

export const useModalContext = () => {
	const ctx = useContext(ModalContext);
	if (!ctx) throw new Error('useModalContext must be used within a ModalContextProvider');
	return ctx;
};

const styles = StyleSheet.create({
	modalContainer: {
		...StyleSheet.absoluteFillObject,
		zIndex: 999,
	},
});
