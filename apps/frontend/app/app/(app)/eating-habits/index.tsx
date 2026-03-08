import { Dimensions, FlatList, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { isWeb } from '@/constants/Constants';
import FoodLabelingInfo from '@/components/FoodLabelingInfo';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '@/redux/hooks';
import { useLanguage } from '@/hooks/useLanguage';
import { excerpt } from '@/constants/HelperFunctions';
import { useFocusEffect } from 'expo-router';
import { myContrastColor } from '@/helper/ColorHelper';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import MarkingBottomSheet from '@/components/MarkingBottomSheet';
import type BottomSheet from '@gorhom/bottom-sheet';
import CollectibleSpot from '@/components/CollectibleItem/CollectibleSpot';
import { CollectibleAt, DatabaseTypes } from 'repo-depkit-common';
import SettingsGroupTitle from '@/components/SettingsGroupTitle';
import SettingsList from '@/components/SettingsList';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ProfileHelper } from '@/redux/actions/Profile/Profile';
import { UPDATE_PROFILE } from '@/redux/Types/types';
import { UserHelper } from '@/helper/UserHelper';
import SettingsListMarkingLabelFast from '@/components/SettingsListMarkingLabelFast';
import { SettingsListProps } from '@/components/SettingsList/types';

const Index = () => {
	useSetPageTitle(TranslationKeys.eating_habits);
	const { theme } = useTheme();
	const dispatch = useDispatch();
	const { translate } = useLanguage();
	const { markings } = useAppSelector((state) => state.food);
	const { primaryColor, selectedTheme: mode } = useAppSelector((state) => state.settings);
	const { user, profile } = useAppSelector((state) => state.authReducer);
	const contrastColor = myContrastColor(primaryColor, theme, mode === 'dark');
	const [readMore, setReadMore] = useState(false);
	const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
	const menuSheetRef = useRef<BottomSheet>(null);
	const [isActive, setIsActive] = useState(false);
	const profileHelper = useMemo(() => new ProfileHelper(), []);
	const isAnonymousUser = UserHelper.isAnonymousUser(user);

	const markingIds = useMemo(() => (markings ?? []).map((m: DatabaseTypes.Markings) => m.id), [markings]);

	const openMenuSheet = useCallback(() => {
		menuSheetRef?.current?.expand();
	}, []);

	const closeMenuSheet = useCallback(() => {
		menuSheetRef?.current?.close();
	}, []);

	useFocusEffect(
		useCallback(() => {
			const timer = setTimeout(() => {
				setIsActive(true);
			}, 100);
			return () => {
				clearTimeout(timer);
				setIsActive(false);
			};
		}, [])
	);

	useEffect(() => {
		const handleResize = () => {
			setScreenWidth(Dimensions.get('window').width);
			if (Dimensions.get('window').width > 600) {
				setReadMore(true);
			}
		};

		const subscription = Dimensions.addEventListener('change', handleResize);

		return () => subscription?.remove();
	}, []);

	const handleReadMore = useCallback(() => {
		setReadMore((prev) => !prev);
	}, []);

	const handleClearMarkings = useCallback(async () => {
		if (!profile) return;

		const updatedProfile = {
			...profile,
			markings: [],
		};

		dispatch({ type: UPDATE_PROFILE, payload: updatedProfile });

		if (isAnonymousUser) return;

		try {
			const result = await profileHelper.updateProfile(updatedProfile);
			if (result) {
				dispatch({ type: UPDATE_PROFILE, payload: result });
			}
		} catch (error) {
			console.error('Error clearing markings:', error);
		}
	}, [dispatch, isAnonymousUser, profile, profileHelper]);

	const renderItem = useCallback(({ item, index }: { item: string; index: number }) => {
		const total = markingIds.length;
		const groupPosition: SettingsListProps['groupPosition'] =
			total === 1 ? 'single' : index === 0 ? 'top' : index === total - 1 ? 'bottom' : 'middle';
		return <SettingsListMarkingLabelFast markingId={item} groupPosition={groupPosition} handleMenuSheet={openMenuSheet} />;
	}, [markingIds.length, openMenuSheet]);

	const keyExtractor = useCallback((id: string) => id, []);

	const ListHeaderComponent = useMemo(() => (
		<View
			style={{
				...styles.eatingHabitsContainer,
				width: isWeb ? (screenWidth > 600 ? '80%' : '100%') : '100%',
				alignSelf: 'center',
			}}
		>
			<Text style={{ ...styles.body1, color: theme.screen.text }}>{readMore ? translate(TranslationKeys.eatinghabits_introduction) : excerpt(translate(TranslationKeys.eatinghabits_introduction), 120)}</Text>
			{readMore && <FoodLabelingInfo textStyle={styles.body2} backgroundColor={primaryColor} />}
			<View style={styles.readMoreContainer}>
				<TouchableOpacity
					onPress={handleReadMore}
					style={{
						...styles.readMoreButton,
						backgroundColor: theme.primary,
					}}
				>
					<Text style={{ ...styles.readMore, color: contrastColor }}>{readMore ? translate(TranslationKeys.read_less) : translate(TranslationKeys.read_more)}</Text>
				</TouchableOpacity>
			</View>
			<SettingsGroupTitle>{translate(TranslationKeys.settings)}</SettingsGroupTitle>
			<SettingsList
				iconBgColor={primaryColor}
				leftIcon={<MaterialCommunityIcons name="broom" size={22} color={theme.screen.icon} />}
				label={translate(TranslationKeys.clear_markings_selection)}
				handleFunction={handleClearMarkings}
				groupPosition="single"
			/>
		</View>
	), [readMore, screenWidth, theme, translate, primaryColor, contrastColor, handleReadMore, handleClearMarkings]);

	const ListFooterComponent = useMemo(() => (
		<CollectibleSpot collectibleKey={CollectibleAt.collectible_at_markings} />
	), []);

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.screen.background }}>
			<FlatList
				data={markingIds}
				renderItem={renderItem}
				keyExtractor={keyExtractor}
				ListHeaderComponent={ListHeaderComponent}
				ListFooterComponent={ListFooterComponent}
				contentContainerStyle={[styles.flatListContent, { backgroundColor: theme.screen.background }]}
				style={{ backgroundColor: theme.screen.background }}
			/>
			{isActive && <MarkingBottomSheet ref={menuSheetRef} onClose={closeMenuSheet} />}
		</SafeAreaView>
	);
};

export default Index;
