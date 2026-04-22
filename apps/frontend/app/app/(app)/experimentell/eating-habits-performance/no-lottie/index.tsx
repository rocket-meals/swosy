/**
 * Eating Habits Performance Variant: Without Lottie Animation
 *
 * Identical to the production eating-habits screen but the Lottie animation
 * is removed entirely. Compare with the Full variant to see how much of the
 * loading delay is caused by the Lottie animation + replaceLottieColors().
 */
import {
	ActivityIndicator,
	Dimensions,
	InteractionManager,
	SafeAreaView,
	ScrollView,
	Text,
	View,
} from 'react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { isWeb } from '@/constants/Constants';
import FoodLabelingInfo from '@/components/FoodLabelingInfo';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '@/redux/hooks';
import SettingsListMarkingLabels from '@/components/SettingsListMarkingLabels';
import { useLanguage } from '@/hooks/useLanguage';
import { excerpt } from '@/constants/HelperFunctions';
import { myContrastColor } from '@/helper/ColorHelper';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import MarkingBottomSheet from '@/components/MarkingBottomSheet';
import type BottomSheet from '@gorhom/bottom-sheet';
import { DatabaseTypes } from 'repo-depkit-common';
import { getTextFromTranslation } from '@/helper/resourceHelper';
import SettingsGroupTitle from '@/components/SettingsGroupTitle';
import SettingsList from '@/components/SettingsList';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { UPDATE_PROFILE } from '@/redux/Types/types';
import { UserHelper } from '@/helper/UserHelper';
import { ProfileHelper } from '@/redux/actions/Profile/Profile';
import { useFocusEffect, useNavigation } from 'expo-router';
import DebugView from '@/components/DebugView';
import eatingHabitsStyles from '../../../eating-habits/styles';
import AppButton from '@/components/AppButton';
import CustomStackHeader from '@/components/CustomStackHeader/CustomStackHeader';
import useIsLtrLanguage from '@/hooks/useIsLtrLanguage';

let _markingContentLoaded = false;

const EatingHabitsPerformanceNoLottie = () => {
	useSetPageTitle(TranslationKeys.eating_habits_performance_no_lottie);
	const { theme } = useTheme();
	const dispatch = useDispatch();
	const { translate, language } = useLanguage();
	const { markingsDict, markingGroupsDict } = useAppSelector((state) => state.food);
	const markings = useMemo(() => Object.values(markingsDict || {}), [markingsDict]);
	const markingGroups = useMemo(() => Object.values(markingGroupsDict || {}), [markingGroupsDict]);
	const { primaryColor, selectedTheme: mode } = useAppSelector((state) => state.settings);
	const { user, profile } = useAppSelector((state) => state.authReducer);
	const contrastColor = myContrastColor(primaryColor, theme, mode === 'dark');
	const [readMore, setReadMore] = useState(false);
	const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
	const menuSheetRef = useRef<BottomSheet>(null);
	const [isActive, setIsActive] = useState(false);
	const [isContentVisible, setIsContentVisible] = useState(_markingContentLoaded);
	const profileHelper = useMemo(() => new ProfileHelper(), []);
	const isAnonymousUser = UserHelper.isAnonymousUser(user);
	const isLtrLanguage = useIsLtrLanguage();
	const isArabic = !isLtrLanguage;
	const navigation = useNavigation();

	useEffect(() => {
		navigation.setOptions({
			header: () => <CustomStackHeader label={translate(TranslationKeys.eating_habits_performance_no_lottie)} />,
		});
	}, [navigation, translate]);

	// Performance timing
	const mountTimeRef = useRef<number>(performance.now());
	const [contentVisibleMs, setContentVisibleMs] = useState<number | null>(null);

	const markingsSections = useMemo(() => {
		if (!markings || markings.length === 0) return [];
		if (!markingGroups || markingGroups.length === 0) {
			return [{ group: null, markingIds: markings.map((m: DatabaseTypes.Markings) => m.id) }];
		}
		const sortedGroups = [...markingGroups].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
		const groupedMarkingIds = new Set<string>();
		const sections: { group: DatabaseTypes.MarkingsGroups | null; markingIds: string[] }[] = [];
		for (const group of sortedGroups) {
			const groupMarkingIds = markings
				.filter((m: DatabaseTypes.Markings) => {
					const groupId = typeof m.group === 'string' ? m.group : (m.group as DatabaseTypes.MarkingsGroups)?.id;
					return groupId === group.id;
				})
				.sort((a: DatabaseTypes.Markings, b: DatabaseTypes.Markings) => {
					const sortA = a.sort ?? Infinity;
					const sortB = b.sort ?? Infinity;
					if (sortA !== sortB) return sortA - sortB;
					return (a.alias || '').localeCompare(b.alias || '');
				})
				.map((m: DatabaseTypes.Markings) => m.id);
			if (groupMarkingIds.length > 0) {
				sections.push({ group, markingIds: groupMarkingIds });
				groupMarkingIds.forEach((id: string) => groupedMarkingIds.add(id));
			}
		}
		const ungroupedIds = markings
			.filter((m: DatabaseTypes.Markings) => !groupedMarkingIds.has(m.id))
			.map((m: DatabaseTypes.Markings) => m.id);
		if (ungroupedIds.length > 0) {
			sections.push({ group: null, markingIds: ungroupedIds });
		}
		return sections;
	}, [markings, markingGroups]);

	const openMenuSheet = () => menuSheetRef?.current?.expand();
	const closeMenuSheet = () => menuSheetRef?.current?.close();

	useFocusEffect(
		useCallback(() => {
			const timer = setTimeout(() => setIsActive(true), 100);
			return () => {
				clearTimeout(timer);
				setIsActive(false);
			};
		}, [])
	);

	useFocusEffect(
		useCallback(() => {
			if (_markingContentLoaded) return;
			const task = InteractionManager.runAfterInteractions(() => {
				_markingContentLoaded = true;
				setIsContentVisible(true);
				setContentVisibleMs(Math.round(performance.now() - mountTimeRef.current));
			});
			return () => task.cancel();
		}, [])
	);

	useEffect(() => {
		const handleResize = () => {
			setScreenWidth(Dimensions.get('window').width);
			if (Dimensions.get('window').width > 600) setReadMore(true);
		};
		const subscription = Dimensions.addEventListener('change', handleResize);
		return () => subscription?.remove();
	}, []);

	const handleClearMarkings = useCallback(async () => {
		if (!profile) return;
		const updatedProfile = { ...profile, markings: [] };
		dispatch({ type: UPDATE_PROFILE, payload: updatedProfile });
		if (isAnonymousUser) return;
		try {
			const result = await profileHelper.updateProfile(updatedProfile);
			if (result) dispatch({ type: UPDATE_PROFILE, payload: result });
		} catch (error) {
			console.error('Error clearing markings:', error);
		}
	}, [dispatch, isAnonymousUser, profile, profileHelper]);

	const totalMarkingsCount = useMemo(() => markings?.length ?? 0, [markings]);

	const debugLogs = useMemo(() => [
		`${translate(TranslationKeys.eating_habits_debug_markings_count)}: ${totalMarkingsCount}`,
		'Lottie: disabled (removed for this variant)',
		contentVisibleMs !== null
			? `${translate(TranslationKeys.eating_habits_debug_content_time)}: ${contentVisibleMs}ms`
			: isContentVisible
				? `${translate(TranslationKeys.eating_habits_debug_content_time)}: cached (instant)`
				: `${translate(TranslationKeys.eating_habits_debug_content_time)}: …`,
	], [totalMarkingsCount, contentVisibleMs, isContentVisible, translate]);

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.screen.background }}>
			<View style={{ flex: 1 }}>
				<ScrollView
					style={{ backgroundColor: theme.screen.background }}
					contentContainerStyle={eatingHabitsStyles.flatListContent}
				>
					{/* Lottie animation intentionally omitted */}
					<View
						style={{
							...eatingHabitsStyles.eatingHabitsContainer,
							width: isWeb ? (screenWidth > 600 ? '80%' : '100%') : '100%',
						}}
					>
						<DebugView title={translate(TranslationKeys.performanceNoLottie)} logs={debugLogs} isVisible />
						<Text
							style={{
								...eatingHabitsStyles.body1,
								color: theme.screen.text,
								...(isArabic ? { textAlign: 'right', writingDirection: 'rtl', alignSelf: 'flex-end' } : {}),
							}}
						>
							{readMore
								? translate(TranslationKeys.eatinghabits_introduction)
								: excerpt(translate(TranslationKeys.eatinghabits_introduction), 120)}
						</Text>
						{readMore && <FoodLabelingInfo textStyle={eatingHabitsStyles.body2} backgroundColor={primaryColor} />}
						<View style={eatingHabitsStyles.readMoreContainer}>
							<AppButton
								text={readMore ? translate(TranslationKeys.read_less) : translate(TranslationKeys.read_more)}
								onPress={() => setReadMore((prev) => !prev)}
								style={{ ...eatingHabitsStyles.readMoreButton, backgroundColor: theme.primary, marginVertical: 0 }}
								textStyle={{ ...eatingHabitsStyles.readMore, color: contrastColor }}
							/>
						</View>
						<SettingsGroupTitle>{translate(TranslationKeys.settings)}</SettingsGroupTitle>
						<SettingsList
							iconBgColor={primaryColor}
							leftIcon={<MaterialCommunityIcons name="broom" size={22} color={theme.screen.icon} />}
							label={translate(TranslationKeys.clear_markings_selection)}
							handleFunction={handleClearMarkings}
							groupPosition="single"
						/>
						{isContentVisible ? (
							markingsSections.map((section) => (
								<View key={section.group?.id || 'ungrouped'}>
									{section.group && (
										<SettingsGroupTitle>
											{getTextFromTranslation(section.group.translations, language) || section.group.alias || ''}
										</SettingsGroupTitle>
									)}
									<SettingsListMarkingLabels
										markingIds={section.markingIds}
										handleMenuSheet={openMenuSheet}
									/>
								</View>
							))
						) : (
							<ActivityIndicator color={primaryColor} style={{ marginTop: 20 }} />
						)}
					</View>
				</ScrollView>
			</View>
			{isActive && <MarkingBottomSheet ref={menuSheetRef} onClose={closeMenuSheet} />}
		</SafeAreaView>
	);
};

export default EatingHabitsPerformanceNoLottie;
