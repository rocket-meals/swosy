import { ActivityIndicator, Dimensions, InteractionManager, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { isWeb } from '@/constants/Constants';
import FoodLabelingInfo from '@/components/FoodLabelingInfo';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '@/redux/hooks';
import SettingsListMarkingLabels from '@/components/SettingsListMarkingLabels';
import { useLanguage } from '@/hooks/useLanguage';
import { excerpt } from '@/constants/HelperFunctions';
import animation from '@/assets/animations/allergist.json';
import LottieView from 'lottie-react-native';
import { useFocusEffect } from 'expo-router';
import { replaceLottieColors } from '@/helper/animationHelper';
import { myContrastColor } from '@/helper/ColorHelper';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import MarkingBottomSheet from '@/components/MarkingBottomSheet';
import type BottomSheet from '@gorhom/bottom-sheet';
import CollectibleSpot from '@/components/CollectibleItem/CollectibleSpot';
import { CollectibleAt, DatabaseTypes } from 'repo-depkit-common';
import { getTextFromTranslation } from '@/helper/resourceHelper';
import SettingsGroupTitle from '@/components/SettingsGroupTitle';
import SettingsList from '@/components/SettingsList';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ProfileHelper } from '@/redux/actions/Profile/Profile';
import { UPDATE_PROFILE } from '@/redux/Types/types';
import { UserHelper } from '@/helper/UserHelper';

// Module-level cache so the expensive color-replacement deep-copy only runs once
// per primaryColor value across all navigations, even when the screen is unmounted.
let _cachedAnimationJson: any = null;
let _cachedPrimaryColor: string | null = null;

// Tracks whether the heavy markings list has been rendered at least once so that
// subsequent navigations (even after a full remount) skip the deferred-render delay.
let _markingContentLoaded = false;

const Index = () => {
	useSetPageTitle(TranslationKeys.eating_habits);
	const { theme } = useTheme();
	const dispatch = useDispatch();
	const { translate, language } = useLanguage();
	const { markings, markingGroups } = useAppSelector((state) => state.food);
	const { primaryColor, appSettings, selectedTheme: mode } = useAppSelector((state) => state.settings);
	const { user, profile } = useAppSelector((state) => state.authReducer);
	const contrastColor = myContrastColor(primaryColor, theme, mode === 'dark');
	const [readMore, setReadMore] = useState(false);
	const [autoPlay, setAutoPlay] = useState(appSettings?.animations_auto_start);
	const animationRef = useRef<LottieView>(null);
	const [animationJson, setAmimationJson] = useState<any>(null);
	const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
	const menuSheetRef = useRef<BottomSheet>(null);
	const [isActive, setIsActive] = useState(false);
	// Initialized from the module-level flag so content appears instantly on re-entry
	// even if the component was fully unmounted and remounted.
	const [isContentVisible, setIsContentVisible] = useState(_markingContentLoaded);
	const profileHelper = useMemo(() => new ProfileHelper(), []);
	const isAnonymousUser = UserHelper.isAnonymousUser(user);

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

	const openMenuSheet = () => {
		menuSheetRef?.current?.expand();
	};

	const closeMenuSheet = () => {
		menuSheetRef?.current?.close();
	};

	useFocusEffect(
		useCallback(() => {
			// Cache hit: set the processed animation immediately, no need to wait for
			// interactions to finish, making re-entry essentially instant.
			if (_cachedAnimationJson && _cachedPrimaryColor === primaryColor) {
				setAmimationJson(_cachedAnimationJson);
				return;
			}

			// Cache miss (first visit or primaryColor changed): defer the expensive
			// deep-copy + color-replacement until after the navigation animation so it
			// never blocks the transition.
			const task = InteractionManager.runAfterInteractions(() => {
				_cachedAnimationJson = replaceLottieColors(animation, primaryColor);
				_cachedPrimaryColor = primaryColor;
				setAmimationJson(_cachedAnimationJson);
			});
			return () => {
				task.cancel();
			};
		}, [primaryColor])
	);

	useFocusEffect(
		useCallback(() => {
			setAutoPlay(appSettings?.animations_auto_start); // Enable when entering

			return () => {
				setAutoPlay(false); // Reset when leaving
			};
		}, [appSettings?.animations_auto_start])
	);

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

	// Defer rendering the heavy markings list (many Gluestack UI Tooltip instances)
	// until after the navigation animation so the transition is never blocked.
	useFocusEffect(
		useCallback(() => {
			if (_markingContentLoaded) {
				// Content was already loaded on a previous visit – nothing to do.
				// isContentVisible is already true (initialized from the flag or preserved
				// across navigations), so no state update is needed.
				return;
			}
			const task = InteractionManager.runAfterInteractions(() => {
				_markingContentLoaded = true;
				setIsContentVisible(true);
			});
			return () => {
				task.cancel();
			};
		}, [])
	);

	useEffect(() => {
		if (animationJson && autoPlay && animationRef.current) {
			animationRef?.current?.play(); // Reset animation to ensure it starts fresh
		}
	}, [animationJson, autoPlay]);

	const renderLottie = useMemo(() => {
		if (animationJson) {
			return <LottieView ref={animationRef} source={animationJson} resizeMode="contain" style={{ width: '100%', height: '100%' }} autoPlay={autoPlay || false} loop={false} />;
		}
	}, [autoPlay, animationJson]);

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

	const handleReadMore = () => {
		setReadMore(!readMore);
	};

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

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.screen.background }}>
			<View style={{ flex: 1 }}>
				<ScrollView style={{ backgroundColor: theme.screen.background }} contentContainerStyle={styles.contentContainer}>
					<View style={styles.gifContainer}>{renderLottie}</View>
					<View
						style={{
							...styles.eatingHabitsContainer,
							width: isWeb ? (screenWidth > 600 ? '80%' : '100%') : '100%',
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
                                        <CollectibleSpot collectibleKey={CollectibleAt.collectible_at_markings} />
                                </View>
                        </ScrollView>
                </View>
                {isActive && <MarkingBottomSheet ref={menuSheetRef} onClose={closeMenuSheet} />}
		</SafeAreaView>
	);
};

export default Index;
