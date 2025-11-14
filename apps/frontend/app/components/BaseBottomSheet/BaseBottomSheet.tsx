import React, { forwardRef, useCallback, useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, type BottomSheetBackdropProps, type BottomSheetProps } from '@gorhom/bottom-sheet';
import { AntDesign } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/reducer';
import styles from './styles';

export interface BaseBottomSheetProps extends Omit<BottomSheetProps, 'backdropComponent'> {
	onClose?: () => void;
}

const BaseBottomSheet = forwardRef<BottomSheet, BaseBottomSheetProps>(({ onClose, children, backgroundStyle, onChange, ...props }, ref) => {
	const renderBackdrop = useCallback((backdropProps: BottomSheetBackdropProps) => <BottomSheetBackdrop {...backdropProps} appearsOnIndex={0} disappearsOnIndex={-1} onPress={onClose} />, [onClose]);
	const { theme } = useTheme();
	useSelector((state: RootState) => state.settings); // ensure theme subscription
	const snapPoints = useMemo(() => ['80%'], []);

	const headerBg = (backgroundStyle && (backgroundStyle as any).backgroundColor) || theme.sheet.sheetBg;
	const handleColor = theme.sheet.closeBg;

	const handleChange = useCallback(
		(index: number) => {
			if (index === -1) {
				onClose?.();
			}
			// @gorhom/bottom-sheet expects (index, position, type)
			(onChange as any)?.(index);
		},
		[onClose, onChange]
	);

	return (
		<BottomSheet ref={ref} snapPoints={snapPoints} backdropComponent={renderBackdrop} backgroundStyle={backgroundStyle} handleComponent={null} onChange={handleChange} {...props}>
			<View style={[styles.header, { backgroundColor: headerBg }]}>
				<View style={styles.placeholder} />
				<View style={[styles.handle, { backgroundColor: handleColor }]} />
				<TouchableOpacity style={[styles.closeButton, { backgroundColor: theme.sheet.closeBg }]} onPress={onClose}>
					<AntDesign name="close" size={24} color={theme.sheet.closeIcon} />
				</TouchableOpacity>
			</View>
			{children}
		</BottomSheet>
	);
});

export default BaseBottomSheet;
