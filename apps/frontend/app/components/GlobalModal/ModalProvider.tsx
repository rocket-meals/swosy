import React, { createContext, useContext, useState, ReactNode, useRef, useEffect } from 'react';
import BaseBottomSheet from '@/components/BaseBottomSheet/BaseBottomSheet';

type ModalContextType = {
	open: (content: ReactNode, options?: { backgroundStyle?: any }) => void;
	close: () => void;
};

const ModalContext = createContext<ModalContextType | null>(null);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const [content, setContent] = useState<ReactNode | null>(null);
	const [backgroundStyle, setBackgroundStyle] = useState<any>(null);
	const sheetRef = useRef<any>(null);

	const open = (c: ReactNode, options?: { backgroundStyle?: any }) => {
		console.log('[GlobalModal] open called');
		setContent(c);
		if (options?.backgroundStyle) setBackgroundStyle(options.backgroundStyle);
	};

	const close = () => {
		console.log('[GlobalModal] close called');
		sheetRef.current?.close?.();
		setTimeout(() => setContent(null), 200);
	};

	// When content is set, ensure the sheet expands once the sheet ref is available
	useEffect(() => {
		if (!content) return;
		console.log('[GlobalModal] content set, scheduling expand');
		// small timeout to allow ref attachment/render
		const t = setTimeout(() => {
			console.log('[GlobalModal] attempting sheetRef.expand');
			sheetRef.current?.expand?.();
		}, 20);
		return () => clearTimeout(t);
	}, [content]);

	return (
		<ModalContext.Provider value={{ open, close }}>
			{children}
			{content && (
				<BaseBottomSheet ref={sheetRef} index={0} backgroundStyle={backgroundStyle} enablePanDownToClose onClose={() => { setContent(null); }}>
					{content}
				</BaseBottomSheet>
			)}
		</ModalContext.Provider>
	);
};

export const useModalContext = () => {
	const ctx = useContext(ModalContext);
	if (!ctx) throw new Error('useModalContext must be used within a ModalProvider');
	return ctx;
};
