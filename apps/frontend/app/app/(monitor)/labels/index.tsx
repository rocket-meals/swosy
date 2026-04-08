import React, { useMemo, useRef } from 'react';
import { ScrollView, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import styles from './styles';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '@/redux/hooks';
import { getTextFromTranslation } from '@/helper/resourceHelper';
import { useMyContrastColor } from '@/helper/ColorHelper';
import { useTheme } from '@/hooks/useTheme';
import LabelHeader from '@/components/LabelHeader/LabelHeader';
import MarkingIcon from '@/components/MarkingIcon';
import MarkingBottomSheet from '@/components/MarkingBottomSheet';
import type BottomSheet from '@gorhom/bottom-sheet';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { useLanguage } from '@/hooks/useLanguage';
import { SET_MARKING_DETAILS } from '@/redux/Types/types';
import { isWeb } from '@/constants/Constants';

const MarkingItem = ({ marking, onPress }: { marking: any; onPress: () => void }) => {
	const { theme } = useTheme();
	const { language, selectedTheme: mode } = useAppSelector((state) => state.settings);
	const isArabic = language === 'ar';
	const markingText = getTextFromTranslation(marking?.translations, language);
	const MarkingColor = useMyContrastColor(marking?.background_color, theme, mode === 'dark');
	const hasVisibleIcon = Boolean(marking?.short_code || marking?.image || marking?.image_remote_url || marking?.icon);

	return (
		<TouchableOpacity style={[styles.iconText, isArabic ? { flexDirection: 'row-reverse' } : undefined]} onPress={onPress}>
			<View style={styles.iconSlot}>
				{hasVisibleIcon ? (
					<MarkingIcon
						marking={
							{
								icon: marking?.icon,
								short_code: marking?.short_code,
								image: marking?.image,
								image_remote_url: marking?.image_remote_url,
								background_color: marking?.background_color,
								hide_border: marking?.hide_border,
							} as any
						}
						size={30}
						color={MarkingColor}
					/>
				) : (
					<View style={styles.iconPlaceholder} />
				)}
			</View>
			<Text
				style={{
					...styles.title,
					color: theme.screen.text,
					fontSize: 14,
					...(isArabic
						? { textAlign: 'right' as const, writingDirection: 'rtl' as const, marginLeft: 0, marginRight: 8 }
						: null),
				}}
			>
				{markingText}
			</Text>
		</TouchableOpacity>
	);
};

const Index = () => {
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const dispatch = useDispatch();
	const menuSheetRef = useRef<BottomSheet>(null);
	const { width } = useWindowDimensions();

	useSetPageTitle(TranslationKeys.markings);

	const openMenuSheet = () => {
		menuSheetRef.current?.expand();
	};

	const closeMenuSheet = () => {
		menuSheetRef.current?.close();
	};

	const { markingsDict } = useAppSelector((state) => state.food);
	const markings = useMemo(() => Object.values(markingsDict || {}), [markingsDict]);
	const columns = isWeb && width >= 900 ? 4 : 2;

	return (
		<ScrollView
			contentContainerStyle={{
				...styles.container,
				backgroundColor: theme.screen.background,
			}}
		>
			<LabelHeader Label={translate(TranslationKeys.markings)} />

			<View style={styles.gridContainer}>
				{markings.map((marking) => (
					<View key={String(marking?.id ?? marking?.alias ?? '')} style={[styles.gridItem, { width: `${100 / columns}%` }]}>
						<MarkingItem
							marking={marking}
							onPress={() => {
								dispatch({ type: SET_MARKING_DETAILS, payload: marking });
								openMenuSheet();
							}}
						/>
					</View>
				))}
			</View>
			<MarkingBottomSheet ref={menuSheetRef} onClose={closeMenuSheet} />
		</ScrollView>
	);
};

export default Index;
