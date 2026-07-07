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
import { AvatarConfig, AvatarStyle, MICAH_PRESETS, MyAvatar, presetToConfig, AvatarSize } from 'repo-depkit-common-ui';
import { parseProfileAvatar, AVATAR_BACKGROUND } from '@/hooks/useAvatarProfileEditor';
import { ProfileHelper } from '@/redux/actions/Profile/Profile';

const STEPS = ['welcome', 'canteen', 'pricegroup', 'preferences'] as const;
const AVATAR_CAROUSEL_SIZE = 44;
const AVATARS_PER_ROW = 4;
const AVATARS_TOTAL = AVATARS_PER_ROW * 2;
// Each slot swaps in 1 second intervals; fade is fast
const AVATAR_FADE_DURATION = 200;
const AVATAR_SLOT_INTERVAL = 1000;
// Padding inside the welcome step's ScrollView contentContainerStyle – used to break the
// carousel out to the full screen edge via negative margin.
const STEP_CONTENT_PADDING = 20;
// User count: animate up to this placeholder while real count loads
const COUNT_PLACEHOLDER_TARGET = 999;
const COUNT_INCREMENT_INTERVAL = 40; // ms between ticks
const COUNT_STEP_MIN = 20;
const COUNT_STEP_MAX = 100;
// How long (ms) the "ready" overlay is visible before navigating to food offers
const READY_OVERLAY_DISPLAY_DURATION = 1400;
const profileHelper = new ProfileHelper();

// Precomputed quickstart configs – AvatarSize.SMALL is stored in the config, but the
// carousel renders with an explicit size={AVATAR_CAROUSEL_SIZE} prop so there is no layout jump.
const QUICKSTART_AVATAR_CONFIGS: AvatarConfig[] = MICAH_PRESETS.map(
	(p) => presetToConfig(p, AvatarStyle.MICAH, AvatarSize.SMALL),
);

const OnboardingScreen = () => {
	useSetPageTitle(TranslationKeys.onboarding);
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const dispatch = useDispatch();
	const { primaryColor, selectedTheme: mode } = useAppSelector((state) => state.settings);
	const { canteens } = useAppSelector((state) => state.canteenReducer);
	const { markings } = useAppSelector((state) => state.food);
	const { isManagement, profile } = useAppSelector((state) => state.authReducer);
	const selectedCanteen = useSelectedCanteen();
	const contrastColor = myContrastColor(primaryColor, theme, mode === 'dark');

	const [currentStepIndex, setCurrentStepIndex] = useState(0);
	const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
	const [userCount, setUserCount] = useState<number | null>(null);
	const [placeholderCount, setPlaceholderCount] = useState(0);
	const [isLoadingCanteens, setIsLoadingCanteens] = useState(true);
	// Track which steps have been mounted for lazy loading
	const [mountedSteps, setMountedSteps] = useState<Set<number>>(new Set([0]));
	const scrollViewRef = useRef<ScrollView>(null);
	const priceAnimRef = useRef<LottieView>(null);
	const [priceAnimationJson, setPriceAnimationJson] = useState<any>(null);

	// Transition overlay state ("Du bist nun startklar")
	const [showReadyOverlay, setShowReadyOverlay] = useState(false);
	const readyOpacity = useRef(new Animated.Value(0)).current;

	// ── Avatar carousel ──────────────────────────────────────────────────────
	// Each slot has its own avatar and opacity – slots swap one at a time
	const [slotAvatars, setSlotAvatars] = useState<AvatarConfig[]>(
		() => QUICKSTART_AVATAR_CONFIGS.slice(0, AVATARS_TOTAL)
	);
	const slotOpacities = useRef(
		Array.from({ length: AVATARS_TOTAL }, () => new Animated.Value(1))
	).current;
	// Pool ref – updated when server data arrives; safe to read in animation callbacks
	const avatarPoolRef = useRef<AvatarConfig[]>(QUICKSTART_AVATAR_CONFIGS);
	const nextPoolIndexRef = useRef(AVATARS_TOTAL);
	const nextSlotRef = useRef(0);

	const isFirstStep = currentStepIndex === 0;
	const isLastStep = currentStepIndex === STEPS.length - 1;

	// User has a complete profile when id, canteen, and price_group are all set
	const hasCompleteProfile = useMemo(() => {
		if (!profile?.id) return false;
		return !!profile?.canteen && !!profile?.price_group;
	}, [profile?.id, profile?.canteen, profile?.price_group]);

	// "Returning user" means the profile is fully configured
	const isReturningUser = hasCompleteProfile;

	// Direct continue is only shown when profile is fully configured (canteen + price_group from server)
	const showDirectContinue = !isLoadingCanteens && hasCompleteProfile;

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
					avatarPoolRef.current = configs;
					nextPoolIndexRef.current = AVATARS_TOTAL;
				}
			} catch (error) {
				console.error('[Onboarding] Failed to load profile avatars:', error);
			}
		};
		loadProfileAvatars();
	}, []);

	// Avatar carousel: one slot swaps at a time, every AVATAR_SLOT_INTERVAL ms
	useEffect(() => {
		let timer: ReturnType<typeof setTimeout>;
		const swapNext = () => {
			const slot = nextSlotRef.current % AVATARS_TOTAL;
			const pool = avatarPoolRef.current;
			const poolIdx = nextPoolIndexRef.current % pool.length;

			Animated.timing(slotOpacities[slot], {
				toValue: 0,
				duration: AVATAR_FADE_DURATION,
				useNativeDriver: true,
			}).start(() => {
				if (pool.length > 0 && poolIdx < pool.length) {
					setSlotAvatars(prev => {
						const next = [...prev];
						if (slot < next.length) {
							next[slot] = pool[poolIdx];
						}
						return next;
					});
				}
				nextPoolIndexRef.current += 1;
				nextSlotRef.current += 1;
				Animated.timing(slotOpacities[slot], {
					toValue: 1,
					duration: AVATAR_FADE_DURATION,
					useNativeDriver: true,
				}).start(() => {
					timer = setTimeout(swapNext, AVATAR_SLOT_INTERVAL);
				});
			});
		};
		timer = setTimeout(swapNext, AVATAR_SLOT_INTERVAL);
		return () => clearTimeout(timer);
	}, [slotOpacities]);

	// User count: animate placeholder counter while real count is loading
	useEffect(() => {
		if (userCount !== null) return; // real data arrived, stop placeholder
		let current = 0;
		const interval = setInterval(() => {
			const step = Math.floor(Math.random() * COUNT_STEP_MAX) + COUNT_STEP_MIN;
			current = Math.min(current + step, COUNT_PLACEHOLDER_TARGET);
			setPlaceholderCount(current);
			if (current >= COUNT_PLACEHOLDER_TARGET) clearInterval(interval);
		}, COUNT_INCREMENT_INTERVAL);
		return () => clearInterval(interval);
	}, [userCount]);

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
		setShowReadyOverlay(true);
		Animated.timing(readyOpacity, {
			toValue: 1,
			duration: 350,
			useNativeDriver: true,
		}).start(() => {
			setTimeout(() => {
				router.replace(('/(app)/' + AppScreens.FOOD_OFFERS) as any);
			}, READY_OVERLAY_DISPLAY_DURATION);
		});
	}, [readyOpacity]);

	const handleScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
		const offsetX = event.nativeEvent.contentOffset.x;
		const newIndex = Math.round(offsetX / screenWidth);
		if (newIndex >= 0 && newIndex < STEPS.length && newIndex !== currentStepIndex) {
			setCurrentStepIndex(newIndex);
		}
	}, [screenWidth, currentStepIndex]);

	const markingIds = useMemo(() => (markings ?? []).map((m: DatabaseTypes.Markings) => m.id), [markings]);

	// Format the user count display:
	// While loading → fixed "00.XXX" format (consistent across all locales)
	// After load → locale-aware format
	const formattedCount = useMemo(() => {
		if (userCount !== null) {
			return userCount.toLocaleString();
		}
		// Consistent "00.XXX" format for the placeholder (0-padded to 5 chars)
		const padded = String(placeholderCount).padStart(5, '0');
		return `${padded.slice(0, 2)}.${padded.slice(2)}`;
	}, [userCount, placeholderCount]);

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
		const row1 = slotAvatars.slice(0, AVATARS_PER_ROW);
		const row2 = slotAvatars.slice(AVATARS_PER_ROW, AVATARS_TOTAL);
		// Avatar cell width: divide screen evenly across the row
		const cellWidth = screenWidth / AVATARS_PER_ROW;
		return (
			<View style={[styles.avatarCarouselContainer, { width: screenWidth, marginHorizontal: -STEP_CONTENT_PADDING }]}>
				<View style={styles.avatarCarouselRow}>
					{row1.map((cfg, i) => (
						<Animated.View
							key={`r1-${i}`}
							style={[styles.avatarCarouselCell, { width: cellWidth, opacity: slotOpacities[i] }]}
						>
							<MyAvatar
								style={cfg.style}
								size={AVATAR_CAROUSEL_SIZE}
								options={cfg.options}
								rounded={true}
								backgroundColor={AVATAR_BACKGROUND}
							/>
						</Animated.View>
					))}
				</View>
				<View style={styles.avatarCarouselRow}>
					{row2.map((cfg, i) => (
						<Animated.View
							key={`r2-${i}`}
							style={[styles.avatarCarouselCell, { width: cellWidth, opacity: slotOpacities[AVATARS_PER_ROW + i] }]}
						>
							<MyAvatar
								style={cfg.style}
								size={AVATAR_CAROUSEL_SIZE}
								options={cfg.options}
								rounded={true}
								backgroundColor={AVATAR_BACKGROUND}
							/>
						</Animated.View>
					))}
				</View>
			</View>
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
				<View style={styles.userCountContainer}>
					<Text style={[styles.stepDescription, { color: theme.screen.text }]}>
						{translate(TranslationKeys.onboarding_complete_user_count_prefix)}
					</Text>
					<View style={[styles.userCountBadge, { backgroundColor: primaryColor }]}>
						<Text style={[styles.userCountNumber, { color: contrastColor }]}>
							{formattedCount}
						</Text>
					</View>
				</View>
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
			{showReadyOverlay && (
				<Animated.View style={[styles.readyOverlay, { opacity: readyOpacity, backgroundColor: primaryColor }]}>
					<MaterialCommunityIcons name="rocket-launch" size={80} color={contrastColor} />
					<Text style={[styles.readyTitle, { color: contrastColor }]}>
						{translate(TranslationKeys.onboarding_ready)}
					</Text>
				</Animated.View>
			)}
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
		gap: 8,
		marginTop: 16,
		overflow: 'hidden',
	},
	avatarCarouselRow: {
		flexDirection: 'row',
	},
	avatarCarouselCell: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 4,
	},
	readyOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 24,
	},
	readyTitle: {
		fontSize: 28,
		fontFamily: 'Poppins_700Bold',
		textAlign: 'center',
		paddingHorizontal: 24,
	},
});

export default OnboardingScreen;

