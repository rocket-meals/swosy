import React from 'react';
import { Text, View } from 'react-native';
import MyImage from '@/components/MyImage';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { isWeb } from '@/constants/Constants';
import { useAppSelector } from '@/redux/hooks';
import { PopupEventSheetProps } from './types';
import { getImageUrl } from '@/constants/HelperFunctions';
import { getTextFromTranslation, getTitleFromTranslation } from '@/helper/resourceHelper';
import ProjectButton from '../ProjectButton';
import { useMyScrollViewModal } from '../GlobalModal/useMyScrollViewModal';
import MyMarkdown from '../MyMarkdown';

const PopupEventSheet: React.FC<PopupEventSheetProps> = ({ closeSheet, dismissSheet, eventData }) => {
	const { theme } = useTheme();
	const { close: closeScrollViewModal } = useMyScrollViewModal();
	const { language } = useAppSelector((state) => state.settings);
	const title = eventData?.translations ? getTitleFromTranslation(eventData?.translations, language) : '';
	const rawText = eventData?.translations ? getTextFromTranslation(eventData?.translations, language) : '';

	const handleClose = () => {
		dismissSheet?.();
		closeScrollViewModal();
		closeSheet();
	};

	return (
		<BottomSheetScrollView style={styles.sheetView} contentContainerStyle={styles.contentContainer}>
			<View
				style={{
					...styles.sheetHeaderClose,
					paddingRight: isWeb ? 10 : 0,
					paddingTop: isWeb ? 10 : 0,
					alignItems: 'center',
				}}
			>
				<ProjectButton text="Schließen und nicht erneut anzeigen" onPress={handleClose} />
			</View>
			<View
				style={{
					...styles.sheetHeaderText,
				}}
			>
				<View />
				<Text
					style={{
						...styles.sheetHeading,
						fontSize: isWeb ? 40 : 28,
						color: theme.screen.text,
					}}
				>
					{title || eventData?.alias}
				</Text>
			</View>
			<View style={styles.popupContainer}>
				{(eventData?.image || eventData?.image_remote_url) && (
					<View style={styles.imageContainer}>
						<MyImage
							style={styles.image}
							remote_image_url={eventData?.image_remote_url || getImageUrl(String(eventData?.image))}
						/>
					</View>
				)}
				{rawText ? <MyMarkdown content={rawText} textColor={theme.screen.text} /> : null}
			</View>
		</BottomSheetScrollView>
	);
};

export default PopupEventSheet;
