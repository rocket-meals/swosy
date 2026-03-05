import React, { ReactNode, useRef } from 'react';
import { Text, View } from 'react-native';
import BaseBottomSheet from '@/components/BaseBottomSheet/BaseBottomSheet';
import { useTheme } from '@/hooks/useTheme';

export interface BaseBottomModalProps {
	children?: ReactNode;
	onClose?: () => void;
	backgroundStyle?: any;
	visible?: boolean;
	title?: string;
}

const BaseBottomModal: React.FC<BaseBottomModalProps> = ({ children, onClose, backgroundStyle, visible, title }) => {
	// Simple wrapper around BaseBottomSheet. Consumers can render this inside a provider or directly.
	const ref = useRef<any>(null);
	const { theme } = useTheme();

	const index = visible === false ? -1 : 0;

	return (
		<BaseBottomSheet ref={ref} index={index} backgroundStyle={backgroundStyle} enablePanDownToClose onClose={onClose}>
			{title && (
				<View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
					<Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.screen.text, textAlign: 'center' }}>{title}</Text>
				</View>
			)}
			{children}
		</BaseBottomSheet>
	);
};

export default BaseBottomModal;
