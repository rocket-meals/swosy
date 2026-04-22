/**
 * Eating Habits Performance Variant: Full (with DebugView timing)
 *
 * Identical to the production eating-habits screen but always shows a
 * DebugView with precise timing measurements so we can identify what
 * takes long on native:
 *   - replaceLottieColors() processing time
 *   - Time until the animation JSON is ready
 *   - Time until the deferred markings list becomes visible
 *   - Total number of markings being rendered
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
import animation from '@/assets/animations/allergist.json';
import type LottieView from 'lottie-react-native';
import { useFocusEffect, useNavigation } from 'expo-router';
import { replaceLottieColors } from '@/helper/animationHelper';
import { myContrastColor } from '@/helper/ColorHelper';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import MarkingBottomSheet from '@/components/MarkingBottomSheet';
import type BottomSheet from '@gorhom/bottom-sheet';
import { DatabaseTypes } from 'repo-depkit-common';
import { getTextFromTranslation } from '@/helper/resourceHelper';
import SettingsGroupTitle from '@/components/SettingsGroupTitle';
import SettingsList from '@/components/SettingsList';
import { Entypo, MaterialCommunityIcons } from '@expo/vector-icons';
import { UPDATE_PROFILE } from '@/redux/Types/types';
import { UserHelper } from '@/helper/UserHelper';
import { ProfileHelper } from '@/redux/actions/Profile/Profile';
import DebugView from '@/components/DebugView';
import eatingHabitsStyles from '../../../eating-habits/styles';
import SafeLottieView from '@/components/SafeLottieView/SafeLottieView';
import AppButton from '@/components/AppButton';
import CustomStackHeader from '@/components/CustomStackHeader/CustomStackHeader';
import useIsLtrLanguage from '@/hooks/useIsLtrLanguage';

// Isolated module-level cache for this variant (does not share with production screen)
let _cachedAnimationJson: any = null;
let _cachedPrimaryColor: string | null = null;
let _markingContentLoaded = false;

const EatingHabitsPerformanceFull = () => {
	useSetPageTitle(TranslationKeys.eating_habits_performance_full);
	const { theme } = useTheme();
	const dispatch = useDispatch();
	const { translate, language } = useLanguage();
	const { markingsDict, markingGroupsDict } = useAppSelector((state) => state.food);
	const markings = useMemo(() => Object.values(markingsDict || {}), [markingsDict]);
	const markingGroups = useMemo(() => Object.values(markingGroupsDict || {}), [markingGroupsDict]);
	const { primaryColor, appSettings, selectedTheme: mode } = useAppSelector((state) => state.settings);
	const { user, profile } = useAppSelector((state) => state.authReducer);
	const contrastColor = myContrastColor(primaryColor, theme, mode === 'dark');
	const [readMore, setReadMore] = useState(false);
	const [autoPlay, setAutoPlay] = useState(appSettings?.animations_auto_start);
	const animationRef = useRef<LottieView>(null);
	const [animationJson, setAnimationJson] = useState<any>(null);
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
			header: () => <CustomStackHeader label={translate(TranslationKeys.eating_habits_performance_full)} />,
		});
	}, [navigation, translate]);

	// Performance timing
	const mountTimeRef = useRef<number>(performance.now());
	const [lottieProcessMs, setLottieProcessMs] = useState<number | null>(null);
	const [animationReadyMs, setAnimationReadyMs] = useState<number | null>(null);
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
			if (_cachedAnimationJson && _cachedPrimaryColor === primaryColor) {
				setAnimationJson(_cachedAnimationJson);
				setAnimationReadyMs(Math.round(performance.now() - mountTimeRef.current));
				return;
			}
			const task = InteractionManager.runAfterInteractions(() => {
				const start = performance.now();
				_cachedAnimationJson = replaceLottieColors(animation, primaryColor);
				_cachedPrimaryColor = primaryColor;
				const elapsed = Math.round(performance.now() - start);
				setLottieProcessMs(elapsed);
				setAnimationJson(_cachedAnimationJson);
				setAnimationReadyMs(Math.round(performance.now() - mountTimeRef.current));
			});
			return () => task.cancel();
		}, [primaryColor])
	);

	useFocusEffect(
		useCallback(() => {
			setAutoPlay(appSettings?.animations_auto_start);
			return () => setAutoPlay(false);
		}, [appSettings?.animations_auto_start])
	);

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
		if (animationJson && autoPlay && animationRef.current) {
			animationRef.current.play();
		}
	}, [animationJson, autoPlay]);

	const renderLottie = useMemo(() => {
		if (animationJson) {
			return (
				<SafeLottieView
					ref={animationRef}
					source={animationJson}
					resizeMode="contain"
					style={{ width: isWeb ? 220 : '100%', height: 220 }}
					autoPlay={autoPlay || false}
					loop={false}
				/>
			);
		}
	}, [autoPlay, animationJson]);

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
		lottieProcessMs !== null
			? `replaceLottieColors(): ${lottieProcessMs}ms (processing only)`
			: 'replaceLottieColors(): cached (instant)',
		animationReadyMs !== null
			? `${translate(TranslationKeys.eating_habits_debug_animation_time)}: ${animationReadyMs}ms`
			: `${translate(TranslationKeys.eating_habits_debug_animation_time)}: …`,
		contentVisibleMs !== null
			? `${translate(TranslationKeys.eating_habits_debug_content_time)}: ${contentVisibleMs}ms`
			: isContentVisible
				? `${translate(TranslationKeys.eating_habits_debug_content_time)}: cached (instant)`
				: `${translate(TranslationKeys.eating_habits_debug_content_time)}: …`,
	], [totalMarkingsCount, lottieProcessMs, animationReadyMs, contentVisibleMs, isContentVisible, translate]);

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.screen.background }}>
			<View style={{ flex: 1 }}>
				<ScrollView
					style={{ backgroundColor: theme.screen.background }}
					contentContainerStyle={[
						eatingHabitsStyles.flatListContent,
						{ paddingBottom: 100 } // Add padding to ensure full scrolling
					]}
				>
					<View style={{ width: '100%', alignItems: 'center' }}>{renderLottie}</View>
					<View
						style={{
							...eatingHabitsStyles.eatingHabitsContainer,
							width: isWeb ? (screenWidth > 600 ? '80%' : '100%') : '100%',
						}}
					>
						<DebugView title={translate(TranslationKeys.performanceFull)} logs={debugLogs} isVisible />
						<Text style={{ 
							...eatingHabitsStyles.body1, 
							color: theme.screen.text,
							textAlign: isArabic ? 'right' : 'left',
							writingDirection: isArabic ? 'rtl' : 'ltr'
						}}>
							{readMore
								? translate(TranslationKeys.eatinghabits_introduction)
								: excerpt(translate(TranslationKeys.eatinghabits_introduction), 120)}
						</Text>
						{readMore && <FoodLabelingInfo textStyle={eatingHabitsStyles.body2} backgroundColor={primaryColor} />}
						<View style={[eatingHabitsStyles.readMoreContainer, isArabic ? { alignItems: 'flex-end' } : undefined]}>
							<AppButton
								text={readMore ? translate(TranslationKeys.read_less) : translate(TranslationKeys.read_more)}
								onPress={() => setReadMore((prev) => !prev)}
								style={{ ...eatingHabitsStyles.readMoreButton, backgroundColor: theme.primary, marginVertical: 0 }}
								textStyle={{ 
									...eatingHabitsStyles.readMore, 
									color: contrastColor,
									textAlign: isArabic ? 'right' : 'left',
									writingDirection: isArabic ? 'rtl' : 'ltr'
								}}
							/>
						</View>
						<SettingsGroupTitle>{translate(TranslationKeys.settings)}</SettingsGroupTitle>
						<SettingsList
							iconBgColor={primaryColor}
							leftIcon={<MaterialCommunityIcons name="broom" size={22} color={theme.screen.icon} />}
							label={translate(TranslationKeys.clear_markings_selection)}
							handleFunction={handleClearMarkings}
							groupPosition="single"
							rightIcon={<Entypo name={isArabic ? "chevron-small-left" : "chevron-small-right"} color={theme.screen.icon} size={24} />}
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

export default EatingHabitsPerformanceFull;
