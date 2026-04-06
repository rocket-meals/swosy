import React, { useEffect, useState } from 'react';
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import Modal from 'react-native-modal';
import { styles } from './styles';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { TranslationKeys } from '@/locales/keys';
import { RootState } from '@/redux/reducer';
import { useAppSelector } from '@/redux/hooks';
import { OverlayBaseProps } from '@/components/DebugView';
import AppButton from '@/components/AppButton';

interface ModalComponentProps extends OverlayBaseProps {
	/** Required for ModalComponent: controls whether the modal is displayed. */
	isVisible: boolean;
	onClose: () => void;
	onSave: () => void;
	showButtons?: boolean;
	disableSave?: boolean;
}

const ModalComponent: React.FC<ModalComponentProps> = ({ isVisible, title = 'Modal Title', onClose, onSave, children, showButtons = true, disableSave }) => {
	const { primaryColor } = useAppSelector((state) => state.settings);
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const [isLargeScreen, setIsLargeScreen] = useState(Dimensions.get('window').width);
	const [backdropOpacity, setBackdropOpacity] = useState(0.7);
	useEffect(() => {
		const onChange = ({ window }: { window: any }) => {
			setIsLargeScreen(window.width);
			setBackdropOpacity(0.7);
		};

		const subscription = Dimensions.addEventListener('change', onChange);

		return () => {
			subscription.remove();
		};
	}, []);

	const closeButtonSize = isLargeScreen < 500 ? 40 : 36;
	const closeIconSize = isLargeScreen < 500 ? 26 : 20;

	return (
		<Modal
			isVisible={isVisible}
			onBackdropPress={onClose}
			onBackButtonPress={onClose}
			animationIn="slideInUp"
			animationOut="slideOutDown"
			backdropOpacity={backdropOpacity}
			style={{ margin: 0 }}
		>
			<View
				style={[
					styles.modalContainer,
					{
						backgroundColor: theme.modal.modalBg,
						width: isLargeScreen < 550 ? '95%' : 600,
					},
				]}
			>
				{/* Title */}
				<View style={styles.modalHeader}>
					<View style={{ width: closeButtonSize, height: closeButtonSize }} />
					<Text
						style={{
							...styles.modalHeading,
							color: theme.modal.text,
							fontSize: isLargeScreen < 500 ? 23 : 28,
						}}
					>
						{translate(title)}
					</Text>
					<TouchableOpacity
						style={{
							...styles.closeButton,
							backgroundColor: theme.modal.closeBg,
							height: closeButtonSize,
							width: closeButtonSize,
						}}
						onPress={onClose}
					>
						<AntDesign name="close" size={closeIconSize} color={theme.modal.closeIcon} />
					</TouchableOpacity>
				</View>

				{/* Content */}
				<View style={styles.content}>{children}</View>

				{/* Action Buttons */}
				{showButtons && (
					<View style={[styles.buttonContainer, { width: '60%' }]}>
						<AppButton
							text={translate(TranslationKeys.cancel)}
							onPress={onClose}
							variant="outline"
							style={{ ...styles.cancelButton, borderColor: primaryColor }}
							textStyle={[styles.buttonText, { color: theme.screen.text }]}
							usePlainText
						/>
						<AppButton
							text={translate(TranslationKeys.save)}
							onPress={onSave}
							disabled={disableSave}
							style={{ ...styles.saveButton, backgroundColor: primaryColor }}
							textStyle={[styles.buttonText, { color: theme.activeText }]}
							usePlainText
						/>
					</View>
				)}
			</View>
		</Modal>
	);
};

export default ModalComponent;
