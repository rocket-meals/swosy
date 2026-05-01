import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/redux/hooks';
import { isWeb } from '@/constants/Constants';
import { useLanguage } from '@/hooks/useLanguage';
import { myContrastColor } from '@/helper/ColorHelper';
import AppButton from '@/components/AppButton';
import useIsLtrLanguage from '@/hooks/useIsLtrLanguage';

// Define the type for the theme prop
type Position = {
	id: string;
	name: string;
	//   icon: string;
};

// Define the props for the component
type FirstDayOfWeekProps = {
	position: Position;
	isSelected: boolean;
	onPress: () => void;
};

const FirstDayOfWeek: React.FC<FirstDayOfWeekProps> = ({ position, isSelected, onPress }) => {
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const { primaryColor, selectedTheme: mode, language } = useAppSelector(state => state.settings);
	const isLtrLanguage = useIsLtrLanguage();
	const isArabic = !isLtrLanguage;
	const contrastColor = myContrastColor(primaryColor, theme, mode === 'dark');
	const checkboxIcon = (
		<MaterialCommunityIcons
			name={isSelected ? 'checkbox-marked' : 'checkbox-blank'}
			size={24}
			color={isSelected ? contrastColor : theme.screen.icon}
		/>
	);
	return (
		<AppButton
			variant="ghost"
			usePlainText
			text={translate(position.name)}
			onPress={onPress}
			style={{
				...styles.row,
				paddingHorizontal: isWeb ? 20 : 10,
				backgroundColor: isSelected ? primaryColor : theme.screen.iconBg,
				marginVertical: 0,
			}}
			textStyle={{
				...styles.text,
				color: isSelected ? contrastColor : theme.header.text,
				textAlign: isArabic ? 'right' : 'left',
				writingDirection: isArabic ? 'rtl' : 'ltr',
			}}
			iconLeft={isArabic ? checkboxIcon : undefined}
			iconRight={!isArabic ? <MaterialCommunityIcons name={isSelected ? 'checkbox-marked' : 'checkbox-blank'} size={24} color={isSelected ? contrastColor : theme.screen.icon} style={styles.radioButton} /> : undefined}
		/>
	);
};

const styles = StyleSheet.create({
	row: {
		marginTop: 10,
		width: '100%',
		height: 50,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderRadius: 12,
	},
	icon: {
		marginRight: 10,
	},
	text: {
		flex: 1,
		fontSize: 16,
		color: 'black',
	},
	radioButton: {
		marginLeft: 'auto',
	},
});

export default FirstDayOfWeek;
