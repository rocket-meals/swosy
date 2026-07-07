import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, NativeScrollEvent, NativeSyntheticEvent, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { useAppSelector } from '@/redux/hooks';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import CanteenSelection from '@/components/CanteenSelection/CanteenSelection';
import SettingsListMarkingLabelsFast from '@/components/SettingsListMarkingLabelsFast';
import PriceGroupSettingsList from '@/components/PriceGroupSettingsList';
import { SET_SELECTED_CANTEEN, SET_BUILDINGS_DICT, SET_CANTEENS } from '@/redux/Types/types';
import { AppScreens, DatabaseTypes } from 'repo-depkit-common';
import { CanteenHelper } from '@/redux/actions';
import { BuildingsHelper } from '@/redux/actions/Buildings/Buildings';
import { getImageUrl } from '@/constants/HelperFunctions';
import { myContrastColor } from '@/helper/ColorHelper';
import { CollectionHelper } from '@/helper/collectionHelper';
import LottieView from 'lottie-react-native';
import animation from '@/assets/animations/priceGroup.json';
import { replaceLottieColors } from '@/helper/animationHelper';
import useSelectedCanteen from '@/hooks/useSelectedCanteen';
import { AvatarConfig, AvatarSize, AvatarStyle, MICAH_PRESETS, MyAvatar, presetToConfig } from 'repo-depkit-common-ui';
import { parseProfileAvatar, AVATAR_BACKGROUND } from '@/hooks/useAvatarProfileEditor';
import { ProfileHelper } from '@/redux/actions/Profile/Profile';

const STEPS = ['welcome', 'canteen', 'pricegroup', 'preferences'] as const;
const AVATAR_CAROUSEL_SIZE = 44;
const AVATARS_PER_ROW = 4;
const AVATARS_PER_BATCH = AVATARS_PER_ROW * 2;
const AVATAR_DISPLAY_DURATION = 5000;
const AVATAR_FADE_DURATION = 500;
const profileHelper = new ProfileHelper();

const OnboardingScreen = () => {
	useSetPageTitle(TranslationKeys.onboarding);
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const dispatch = useDispatch();
	const { primaryColor, selectedTheme: mode } = useAppSelector((state) => state.settings);
	const { canteens } = useAppSelector((state) => state.canteenReducer);
	const { markings } = useAppSelector((state) => state.food);
	const { isManagement, profile, user } = useAppSelector((state) => state.authReducer);
	const selectedCanteen = useSelectedCanteen();
	const contrastColor = myContrastColor(primaryColor, theme, mode === 'dark');

	const [currentStepIndex, setCurrentStepIndex] = useState(0);
	const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
	const [userCount, setUserCount] = useState<number | null>(null);
	const [isLoadingCanteens, setIsLoadingCanteens] = useState(true);
	// Track which steps have been mounted for lazy loading
	const [mountedSteps, setMountedSteps] = useState<Set<number>>(new Set([0]));
	const scrollViewRef = useRef<ScrollView>(null);
	const priceAnimRef = useRef<LottieView>(null);
	const [priceAnimationJson, setPriceAnimationJson] = useState<any>(null);

	// Returning user: canteen already set, show simple continue button
	const [showDirectContinue, setShowDirectContinue] = useState(false);

	// Avatar carousel state
	const quickstartAvatarConfigs = useMemo<AvatarConfig[]>(() =>
		MICAH_PRESETS.map((p) => presetToConfig(p, AvatarStyle.MICAH, AvatarSize.SMALL)),
	[]);
	const [avatarPool, setAvatarPool] = useState<AvatarConfig[]>(quickstartAvatarConfigs);
	const [carouselBatchIndex, setCarouselBatchIndex] = useState(0);
	const carouselOpacity = useRef(new Animated.Value(1)).current;

	const isFirstStep = currentStepIndex === 0;
	const isLastStep = currentStepIndex === STEPS.length - 1;

	const isReturningUser = useMemo(() => {
		const dateCreated = (user as { date_created?: string | null })?.date_created;
		if (!dateCreated) return false;
		return Date.now() - new Date(dateCreated).getTime() > 24 * 60 * 60 * 1000;
	}, [(user as { date_created?: string | null })?.date_created]);

	const canteenHelper = useMemo(() => new CanteenHelper(), []);
	const buildingsHelper = useMemo(() => new BuildingsHelper(), []);

	useEffect(() => {
		const subscription = Dimensions.addEventListener('change', ({ window }) => {
			setScreenWidth(window.width);
		});
		return () => subscription?.remove();
	}, []);

	useEffect(() => {
		const json = replaceLottieColors(animation, primaryColor);
		setPriceAnimationJson(json);
	}, [primaryColor]);

	useEffect(() => {
		const loadCanteens = async () => {
			setIsLoadingCanteens(true);
			try {
				const buildingsData = (await buildingsHelper.fetchBuildings({})) as DatabaseTypes.Buildings[];
				const buildings = buildingsData || [];
				const buildingsDict = buildings.reduce((acc: Record<string, DatabaseTypes.Buildings>, building: DatabaseTypes.Buildings) => {
					acc[building.id] = building;
					return acc;
				}, {} as Record<string, DatabaseTypes.Buildings>);
				dispatch({ type: SET_BUILDINGS_DICT, payload: buildingsDict });

				const canteensData = (await canteenHelper.fetchCanteens({})) as DatabaseTypes.Canteens[];
				const filteredCanteens = (canteensData || []).filter(canteen => {
					const status = canteen.status || '';
					if (!isManagement) return status === 'published';
					return status === 'published' || status === 'archived';
				});

				const sortedCanteens = filteredCanteens.sort((a, b) => (a.sort || 0) - (b.sort || 0));
				const updatedCanteens = sortedCanteens.map(canteen => {
					const building = buildingsDict[canteen?.building as string];
					return {
						...canteen,
						imageAssetId: building?.image,
						thumbHash: building?.image_thumb_hash,
						image_url: building?.image_remote_url || getImageUrl(building?.image),
					};
				});
				dispatch({ type: SET_CANTEENS, payload: updatedCanteens });
			} catch (error) {
				console.error('Error loading canteens for onboarding:', error);
			} finally {
				setIsLoadingCanteens(false);
			}
		};

		loadCanteens();
	}, [isManagement, canteenHelper, buildingsHelper, dispatch]);

	// Auto-select canteen from profile once canteens are loaded
	useEffect(() => {
		if (isLoadingCanteens || selectedCanteen || canteens.length === 0) return;
		let profileCanteenId: string | null = null;
		if (profile?.canteen) {
			if (typeof profile.canteen === 'string') {
				profileCanteenId = profile.canteen;
			} else {
				profileCanteenId = (profile.canteen as DatabaseTypes.Canteens)?.id ?? null;
			}
		}
		if (!profileCanteenId) return;
		const canteen = canteens.find((c) => String(c.id) === String(profileCanteenId));
		if (canteen) {
			dispatch({ type: SET_SELECTED_CANTEEN, payload: canteen });
		}
	}, [profile?.canteen, canteens, selectedCanteen, isLoadingCanteens, dispatch]);

	// Show direct continue button when canteen is already set (returning user with existing setup)
	useEffect(() => {
		if (!isLoadingCanteens && selectedCanteen && currentStepIndex === 0) {
			setShowDirectContinue(true);
		}
	}, [selectedCanteen, isLoadingCanteens, currentStepIndex]);

	// Load profiles with avatar field for the carousel
	useEffect(() => {
		const loadProfileAvatars = async () => {
			try {
				const profiles = await profileHelper.readItems({
					filter: { avatar: { _nnull: true } },
					sort: ['-date_updated'],
					limit: 100,
					fields: ['avatar'],
				});
				const configs: AvatarConfig[] = [];
				for (const p of profiles) {
					const cfg = parseProfileAvatar((p as any).avatar);
					if (cfg) configs.push(cfg);
				}
				if (configs.length > 0) {
					setAvatarPool(configs);
					setCarouselBatchIndex(0);
				}
			} catch {
				// Keep using quickstart avatars on error
			}
		};
		loadProfileAvatars();
	}, []);

	// Avatar carousel: fade out → switch batch → fade in every AVATAR_DISPLAY_DURATION ms
	useEffect(() => {
		const cycleAvatars = () => {
			Animated.timing(carouselOpacity, {
				toValue: 0,
				duration: AVATAR_FADE_DURATION,
				useNativeDriver: true,
			}).start(() => {
				setCarouselBatchIndex((prev) => prev + 1);
				Animated.timing(carouselOpacity, {
					toValue: 1,
					duration: AVATAR_FADE_DURATION,
					useNativeDriver: true,
				}).start();
			});
		};
		const timer = setInterval(cycleAvatars, AVATAR_DISPLAY_DURATION + AVATAR_FADE_DURATION * 2);
		return () => clearInterval(timer);
	}, [carouselOpacity]);

	const goToStep = useCallback((index: number) => {
		setCurrentStepIndex(index);
		// Lazy-mount the target step (and the one after it for smooth preloading)
		setMountedSteps((prev) => {
			const updatedSteps = new Set(prev);
			updatedSteps.add(index);
			if (index + 1 < STEPS.length) updatedSteps.add(index + 1);
			return updatedSteps;
		});
		scrollViewRef.current?.scrollTo({ x: index * screenWidth, animated: true });
	}, [screenWidth]);

	useEffect(() => {
		const fetchUserCount = async () => {
			try {
				const usersHelper = new CollectionHelper<DatabaseTypes.DirectusUsers>('directus_users');
				const result: { count: string | number }[] = await usersHelper.aggregateItems({
					aggregate: { count: '*' },
				}) as { count: string | number }[];
				const count = result?.[0]?.count;
				setUserCount(typeof count === 'number' ? count : parseInt(count, 10) || null);
			} catch (error) {
				console.error('Error fetching user count:', error);
			}
		};
		fetchUserCount();
	}, []);

	const handleNext = useCallback(() => {
		if (!isLastStep) {
			goToStep(currentStepIndex + 1);
		}
	}, [isLastStep, currentStepIndex, goToStep]);

	const handleBack = useCallback(() => {
		if (!isFirstStep) {
			goToStep(currentStepIndex - 1);
		}
	}, [isFirstStep, currentStepIndex, goToStep]);

	const handleSelectCanteen = useCallback((canteen: DatabaseTypes.Canteens) => {
		dispatch({ type: SET_SELECTED_CANTEEN, payload: canteen });
		const canteenStepIndex = STEPS.indexOf('canteen');
		if (canteenStepIndex < STEPS.length - 1) {
			goToStep(canteenStepIndex + 1);
		}
	}, [dispatch, goToStep]);

	const handleSelectPriceGroup = useCallback(() => {
		const priceGroupStepIndex = STEPS.indexOf('pricegroup');
		if (priceGroupStepIndex < STEPS.length - 1) {
			goToStep(priceGroupStepIndex + 1);
		}
	}, [goToStep]);

	const handleStart = useCallback(() => {
		router.replace(('/(app)/' + AppScreens.FOOD_OFFERS) as any);
	}, []);

	const handleScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
		const offsetX = event.nativeEvent.contentOffset.x;
		const newIndex = Math.round(offsetX / screenWidth);
		if (newIndex >= 0 && newIndex < STEPS.length && newIndex !== currentStepIndex) {
			setCurrentStepIndex(newIndex);
		}
	}, [screenWidth, currentStepIndex]);

	const markingIds = useMemo(() => (markings ?? []).map((m: DatabaseTypes.Markings) => m.id), [markings]);

	const renderStepIndicator = () => (
		<View style={styles.stepIndicatorContainer}>
			{STEPS.map((_, index) => (
				<TouchableOpacity
					key={index}
					onPress={() => goToStep(index)}
					style={[
						styles.stepDot,
						{
							backgroundColor: index === currentStepIndex ? primaryColor : theme.screen.iconBg,
							width: index === currentStepIndex ? 24 : 8,
						},
					]}
				/>
			))}
		</View>
	);

	const renderAvatarCarousel = () => {
		const poolSize = avatarPool.length;
		if (poolSize === 0) return null;
		const batchStart = (carouselBatchIndex * AVATARS_PER_BATCH) % poolSize;
		const batch: AvatarConfig[] = [];
		for (let i = 0; i < AVATARS_PER_BATCH; i++) {
			batch.push(avatarPool[(batchStart + i) % poolSize]);
		}
		const row1 = batch.slice(0, AVATARS_PER_ROW);
		const row2 = batch.slice(AVATARS_PER_ROW, AVATARS_PER_BATCH);
		return (
			<Animated.View style={[styles.avatarCarouselContainer, { opacity: carouselOpacity }]}>
				<View style={styles.avatarCarouselRow}>
					{row1.map((cfg, i) => (
						<MyAvatar
							key={`r1-${i}`}
							config={cfg}
							size={AVATAR_CAROUSEL_SIZE}
							rounded={true}
							backgroundColor={AVATAR_BACKGROUND}
						/>
					))}
				</View>
				<View style={styles.avatarCarouselRow}>
					{row2.map((cfg, i) => (
						<MyAvatar
							key={`r2-${i}`}
							config={cfg}
							size={AVATAR_CAROUSEL_SIZE}
							rounded={true}
							backgroundColor={AVATAR_BACKGROUND}
						/>
					))}
				</View>
			</Animated.View>
		);
	};

	const renderWelcomeStep = () => (
		<View style={[styles.stepContent, { width: screenWidth }]}>
			<ScrollView contentContainerStyle={styles.stepScrollContent}>
				<MaterialCommunityIcons
					name={isReturningUser ? 'hand-wave' : 'check-decagram'}
					size={80}
					color={primaryColor}
				/>
				<Text style={[styles.stepTitle, { color: theme.screen.text }]}>
					{isReturningUser
						? translate(TranslationKeys.onboarding_welcome_back)
						: translate(TranslationKeys.onboarding_welcome)}
				</Text>
				<Text style={[styles.stepDescription, { color: theme.screen.text }]}>
					{isReturningUser
						? translate(TranslationKeys.onboarding_loading_profile)
						: translate(TranslationKeys.onboarding_welcome_description)}
				</Text>
				{isLoadingCanteens && <ActivityIndicator size="large" color={primaryColor} style={{ marginTop: 8 }} />}
				{userCount !== null && (
					<View style={styles.userCountContainer}>
						<Text style={[styles.stepDescription, { color: theme.screen.text }]}>
							{translate(TranslationKeys.onboarding_complete_user_count_prefix)}
						</Text>
						<View style={[styles.userCountBadge, { backgroundColor: primaryColor }]}>
							<Text style={[styles.userCountNumber, { color: contrastColor }]}>
								{userCount.toLocaleString()}
							</Text>
						</View>
					</View>
				)}
				{renderAvatarCarousel()}
			</ScrollView>
		</View>
	);

	const renderCanteenStep = () => (
		<View style={[styles.stepContent, { width: screenWidth }]}>
			<ScrollView contentContainerStyle={styles.stepScrollContentNoHPad}>
				<Text style={[styles.stepTitle, { color: theme.screen.text, paddingHorizontal: 20 }]}>
					{translate(TranslationKeys.onboarding_select_canteen)}
				</Text>
				{canteens.length === 0 ? (
					<View style={styles.emptyStateContainer}>
						<MaterialCommunityIcons name="store-off-outline" size={48} color={theme.screen.icon} />
						<Text style={[styles.emptyStateText, { color: theme.screen.text }]}>
							{translate(TranslationKeys.onboarding_no_canteens_available)}
						</Text>
					</View>
				) : (
					<CanteenSelection onSelectCanteen={handleSelectCanteen} />
				)}
			</ScrollView>
		</View>
	);

	const renderPreferencesStep = () => (
		<View style={[styles.stepContent, { width: screenWidth }]}>
			<ScrollView contentContainerStyle={styles.stepScrollContentNoHPad}>
				<Text style={[styles.stepTitle, { color: theme.screen.text, paddingHorizontal: 20 }]}>
					{translate(TranslationKeys.onboarding_preferences)}
				</Text>
				<Text style={[styles.stepDescription, { color: theme.screen.text, paddingHorizontal: 20 }]}>
					{translate(TranslationKeys.eatinghabits_introduction)}
				</Text>
				<View style={styles.markingsContainer}>
					<SettingsListMarkingLabelsFast markingIds={markingIds} />
				</View>
			</ScrollView>
		</View>
	);

	const renderPriceGroupStep = () => (
		<View style={[styles.stepContent, { width: screenWidth }]}>
			<ScrollView contentContainerStyle={styles.stepScrollContentNoHPad}>
				<Text style={[styles.stepTitle, { color: theme.screen.text, paddingHorizontal: 20 }]}>
					{translate(TranslationKeys.onboarding_price_group)}
				</Text>
				<Text style={[styles.stepDescription, { color: theme.screen.text, paddingHorizontal: 20 }]}>
					{translate(TranslationKeys.onboarding_price_group_description)}
				</Text>
				{priceAnimationJson && (
					<View style={styles.lottieContainer}>
						<LottieView ref={priceAnimRef} source={priceAnimationJson} resizeMode="contain" style={{ width: '100%', height: '100%' }} autoPlay loop={false} />
					</View>
				)}
				<View style={styles.priceGroupContainer}>
					<PriceGroupSettingsList onSelect={handleSelectPriceGroup} />
				</View>
			</ScrollView>
		</View>
	);

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: theme.screen.background }]}>
			<ScrollView
				ref={scrollViewRef}
				horizontal
				pagingEnabled
				showsHorizontalScrollIndicator={false}
				onMomentumScrollEnd={handleScrollEnd}
				scrollEventThrottle={16}
				style={styles.horizontalScroll}
				scrollEnabled={!showDirectContinue}
			>
				{mountedSteps.has(0) ? renderWelcomeStep() : <View style={[styles.stepContent, { width: screenWidth }]} />}
				{!showDirectContinue && (mountedSteps.has(1) ? renderCanteenStep() : <View style={[styles.stepContent, { width: screenWidth }]} />)}
				{!showDirectContinue && (mountedSteps.has(2) ? renderPriceGroupStep() : <View style={[styles.stepContent, { width: screenWidth }]} />)}
				{!showDirectContinue && (mountedSteps.has(3) ? renderPreferencesStep() : <View style={[styles.stepContent, { width: screenWidth }]} />)}
			</ScrollView>
			{!showDirectContinue && renderStepIndicator()}
			<View style={[styles.navigationContainer, { borderTopColor: theme.screen.iconBg }]}>
				{showDirectContinue ? (
					<TouchableOpacity
						onPress={handleStart}
						style={[styles.navButtonPrimary, styles.navButtonCentered, { backgroundColor: primaryColor }]}
						activeOpacity={0.8}
					>
						<Text style={[styles.navButtonPrimaryText, { color: contrastColor }]}>
							{translate(TranslationKeys.onboarding_next)}
						</Text>
						<MaterialCommunityIcons name="chevron-right" size={24} color={contrastColor} />
					</TouchableOpacity>
				) : (
					<>
						{!isFirstStep ? (
							<TouchableOpacity
								onPress={handleBack}
								style={[styles.navButtonPrimary, { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.screen.iconBg }]}
							>
								<MaterialCommunityIcons name="chevron-left" size={24} color={theme.screen.text} />
								<Text style={[styles.navButtonPrimaryText, { color: theme.screen.text }]}>
									{translate(TranslationKeys.onboarding_back)}
								</Text>
							</TouchableOpacity>
						) : (
							<View style={styles.navButtonPrimary} />
						)}
						{!isLastStep ? (
							<TouchableOpacity
								onPress={handleNext}
								style={[styles.navButtonPrimary, { backgroundColor: primaryColor }]}
							>
								<Text style={[styles.navButtonPrimaryText, { color: contrastColor }]}>
									{translate(TranslationKeys.onboarding_next)}
								</Text>
								<MaterialCommunityIcons name="chevron-right" size={24} color={contrastColor} />
							</TouchableOpacity>
						) : (
							<TouchableOpacity
								onPress={handleStart}
								style={[styles.navButtonPrimary, { backgroundColor: primaryColor }]}
								activeOpacity={0.8}
							>
								<MaterialCommunityIcons name="rocket-launch" size={24} color={contrastColor} />
								<Text style={[styles.navButtonPrimaryText, { color: contrastColor }]}>
									{translate(TranslationKeys.onboarding_start)}
								</Text>
							</TouchableOpacity>
						)}
					</>
				)}
			</View>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	horizontalScroll: {
		flex: 1,
	},
	stepIndicatorContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 8,
		marginTop: 8,
		marginBottom: 4,
	},
	stepDot: {
		height: 8,
		borderRadius: 4,
	},
	stepContent: {
		flex: 1,
	},
	stepScrollContent: {
		flexGrow: 1,
		alignItems: 'center',
		gap: 16,
		padding: 20,
	},
	stepScrollContentNoHPad: {
		flexGrow: 1,
		alignItems: 'center',
		gap: 16,
		paddingVertical: 20,
	},
	stepTitle: {
		fontSize: 24,
		fontFamily: 'Poppins_700Bold',
		textAlign: 'center',
	},
	stepDescription: {
		fontSize: 16,
		fontFamily: 'Poppins_400Regular',
		textAlign: 'center',
		opacity: 0.8,
		paddingHorizontal: 16,
	},
	emptyStateContainer: {
		alignItems: 'center',
		gap: 12,
		paddingVertical: 32,
	},
	emptyStateText: {
		fontSize: 14,
		fontFamily: 'Poppins_400Regular',
		textAlign: 'center',
		opacity: 0.6,
	},
	markingsContainer: {
		width: '100%',
		marginTop: 8,
	},
	priceGroupContainer: {
		width: '100%',
		marginTop: 8,
	},
	lottieContainer: {
		width: 180,
		height: 180,
	},
	userCountContainer: {
		alignItems: 'center',
		gap: 12,
		marginTop: 8,
	},
	userCountBadge: {
		borderRadius: 24,
		paddingHorizontal: 32,
		paddingVertical: 16,
		alignItems: 'center',
		justifyContent: 'center',
	},
	userCountNumber: {
		fontSize: 48,
		fontFamily: 'Poppins_700Bold',
	},
	navigationContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderTopWidth: 1,
	},
	navButtonPrimary: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 24,
		minWidth: 80,
	},
	navButtonPrimaryText: {
		fontSize: 16,
		fontFamily: 'Poppins_700Bold',
	},
	navButtonCentered: {
		alignSelf: 'center',
	},
	avatarCarouselContainer: {
		width: '100%',
		gap: 8,
		marginTop: 16,
		alignItems: 'center',
	},
	avatarCarouselRow: {
		flexDirection: 'row',
		gap: 8,
		justifyContent: 'center',
	},
});

export default OnboardingScreen;
