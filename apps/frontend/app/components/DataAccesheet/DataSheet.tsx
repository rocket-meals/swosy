import { Text, View } from 'react-native';
import React from 'react';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { DataSheetProps } from './types';
import { isWeb } from '@/constants/Constants';
import { useLanguage } from '@/hooks/useLanguage';
import useIsLtrLanguage from '@/hooks/useIsLtrLanguage';

const DataSheet: React.FC<DataSheetProps> = ({ closeSheet, content }) => {
	const { theme } = useTheme();
	const { language } = useLanguage();
	const isLtrLanguage = useIsLtrLanguage();
	const isRtl = !isLtrLanguage;
	console.log('Content Value', content?.value);
	return (
		<BottomSheetScrollView style={{ ...styles.sheetView, backgroundColor: theme.sheet.sheetBg }} contentContainerStyle={styles.contentContainer}>
			<View
				style={{
					...styles.sheetHeader,
					paddingRight: isWeb ? 10 : 0,
					paddingTop: isWeb ? 10 : 0,
				}}
			>
				<View />
				<Text
					style={{
						...styles.sheetHeading,
						maxWidth: '70%',
						textAlign: isRtl ? 'right' : 'center',
						fontSize: isWeb ? 40 : 22,
						color: theme.sheet.text,
						...(isRtl ? { writingDirection: 'rtl' as const } : {}),
					}}
				>
					{content?.label}
				</Text>
			</View>

			<Text style={{ fontSize: isWeb ? 18 : 16, color: theme.sheet.text, textAlign: 'left', writingDirection: 'ltr' }}>
				{content?.value ? JSON.stringify(content.value, null, 2) : JSON.stringify({}, null, 2)}
			</Text>
		</BottomSheetScrollView>
	);
};

export default DataSheet;
