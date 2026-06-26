import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FontAwesome, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { useAppSelector } from '@/redux/hooks';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import CanteenSelection from '@/components/CanteenSelection/CanteenSelection';
import SettingsListMarkingLabelFast from '@/components/SettingsListMarkingLabelFast';
import SettingsList from '@/components/SettingsList';
import { SET_SELECTED_CANTEEN, SET_BUILDINGS_DICT, SET_CANTEENS, UPDATE_PROFILE } from '@/redux/Types/types';
import { AppScreens, DatabaseTypes } from 'repo-depkit-common';
import { CanteenHelper } from '@/redux/actions';
import { BuildingsHelper } from '@/redux/actions/Buildings/Buildings';
import { getImageUrl } from '@/constants/HelperFunctions';
import { myContrastColor } from '@/helper/ColorHelper';
import { PriceGroupKey } from '@/app/(app)/settings/types';
import { ProfileHelper } from '@/redux/actions/Profile/Profile';
import { UserHelper } from '@/helper/UserHelper';

const STEPS = ['welcome', 'canteen', 'pricegroup', 'preferences', 'complete'] as const;
type Step = typeof STEPS[number];

const OnboardingScreen = () => {
	useSetPageTitle(TranslationKeys.onboarding);
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const dispatch = useDispatch();
	const { primaryColor, selectedTheme: mode, serverInfo } = useAppSelector((state) => state.settings);
	const { canteens, selectedCanteen } = useAppSelector((state) => state.canteenReducer);
	const { markings } = useAppSelector((state) => state.food);
	const { isManagement, user, profile } = useAppSelector((state) => state.authReducer);
	const contrastColor = myContrastColor(primaryColor, theme, mode === 'dark');
	const isRegisteredUser = UserHelper.isRegisteredUser(user);

	const [currentStepIndex, setCurrentStepIndex] = useState(0);
	const [selectedPriceGroup, setSelectedPriceGroup] = useState<string | null>(profile?.price_group || PriceGroupKey.student);
	const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
	const scrollViewRef = useRef<ScrollView>(null);

	const currentStep = STEPS[currentStepIndex];
	const isFirstStep = currentStepIndex === 0;
	const isLastStep = currentStepIndex === STEPS.length - 1;

	const canteenHelper = useMemo(() => new CanteenHelper(), []);
	const buildingsHelper = useMemo(() => new BuildingsHelper(), []);
	const profileHelper = useMemo(() => new ProfileHelper(), []);

	useEffect(() => {
		setSelectedPriceGroup(profile?.price_group || PriceGroupKey.student);
	}, [profile]);

	useEffect(() => {
		const subscription = Dimensions.addEventListener('change', ({ window }) => {
			setScreenWidth(window.width);
		});
		return () => subscription?.remove();
	}, []);

	useEffect(() => {
		const loadCanteens = async () => {
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
			}
		};

		loadCanteens();
	}, [isManagement, canteenHelper, buildingsHelper, dispatch]);

	const goToStep = useCallback((index: number) => {
		setCurrentStepIndex(index);
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
			setTimeout(() => goToStep(canteenStepIndex + 1), 300);
		}
	}, [dispatch, goToStep]);

	const handleStart = useCallback(() => {
		router.replace(('/(app)/' + AppScreens.FOOD_OFFERS) as any);
	}, []);

	const handleSelectPriceGroup = useCallback(async (option: string) => {
		try {
			setSelectedPriceGroup(option);
			const payload = { ...profile, price_group: option };
			if (isRegisteredUser) {
				const result = (await profileHelper.updateProfile(payload)) as DatabaseTypes.Profiles;
				if (result) {
					dispatch({ type: UPDATE_PROFILE, payload: result });
				}
			} else {
				dispatch({ type: UPDATE_PROFILE, payload });
			}
		} catch (error) {
			console.error('Error updating price group:', error);
			setSelectedPriceGroup(profile?.price_group || PriceGroupKey.student);
		}
	}, [profile, isRegisteredUser, profileHelper, dispatch]);

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

	const renderWelcome = () => (
		<View style={[styles.stepContent, { width: screenWidth }]}>
			<ScrollView contentContainerStyle={styles.stepScrollContent}>
				<MaterialCommunityIcons name="rocket-launch" size={80} color={primaryColor} />
				<Text style={[styles.stepTitle, { color: theme.screen.text }]}>
					{translate(TranslationKeys.onboarding_welcome)}
				</Text>
				<Text style={[styles.stepDescription, { color: theme.screen.text }]}>
					{translate(TranslationKeys.onboarding_welcome_description)}
				</Text>
			</ScrollView>
		</View>
	);

	const renderCanteenStep = () => (
		<View style={[styles.stepContent, { width: screenWidth }]}>
			<ScrollView contentContainerStyle={styles.stepScrollContent}>
				<Text style={[styles.stepTitle, { color: theme.screen.text }]}>
					{translate(TranslationKeys.onboarding_select_canteen)}
				</Text>
				<Text style={[styles.stepDescription, { color: theme.screen.text }]}>
					{translate(TranslationKeys.onboarding_select_canteen_description)}
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
			<ScrollView contentContainerStyle={styles.stepScrollContent}>
				<Text style={[styles.stepTitle, { color: theme.screen.text }]}>
					{translate(TranslationKeys.onboarding_preferences)}
				</Text>
				<Text style={[styles.stepDescription, { color: theme.screen.text }]}>
					{translate(TranslationKeys.onboarding_preferences_description)}
				</Text>
				<View style={styles.markingsContainer}>
					{markingIds.map((markingId, index) => {
						const total = markingIds.length;
						const groupPosition = total === 1 ? 'single' : index === 0 ? 'top' : index === total - 1 ? 'bottom' : 'middle';
						return (
							<SettingsListMarkingLabelFast
								key={markingId}
								markingId={markingId}
								groupPosition={groupPosition}
							/>
						);
					})}
				</View>
			</ScrollView>
		</View>
	);

	const priceGroupOptions = useMemo(() => [
		{
			id: PriceGroupKey.student,
			label: translate(TranslationKeys.price_group_student),
			icon: <FontAwesome name="graduation-cap" size={24} color={theme.screen.icon} />,
		},
		{
			id: PriceGroupKey.employee,
			label: translate(TranslationKeys.price_group_employee),
			icon: <Ionicons name="bag" size={24} color={theme.screen.icon} />,
		},
		{
			id: PriceGroupKey.guest,
			label: translate(TranslationKeys.price_group_guest),
			icon: <FontAwesome5 name="users" size={24} color={theme.screen.icon} />,
		},
	], [translate, theme.screen.icon]);

	const renderPriceGroupStep = () => (
		<View style={[styles.stepContent, { width: screenWidth }]}>
			<ScrollView contentContainerStyle={styles.stepScrollContent}>
				<Text style={[styles.stepTitle, { color: theme.screen.text }]}>
					{translate(TranslationKeys.onboarding_price_group)}
				</Text>
				<Text style={[styles.stepDescription, { color: theme.screen.text }]}>
					{translate(TranslationKeys.onboarding_price_group_description)}
				</Text>
				<View style={styles.priceGroupContainer}>
					{priceGroupOptions.map((option, index) => {
						const isSelected = selectedPriceGroup === option.id;
						const groupPosition =
							priceGroupOptions.length === 1
								? 'single'
								: index === 0
									? 'top'
									: index === priceGroupOptions.length - 1
										? 'bottom'
										: 'middle';

						return (
							<SettingsList
								key={option.id}
								label={option.label}
								leftIcon={option.icon}
								iconBgColor={primaryColor}
								groupPosition={groupPosition}
								showSeparator={index !== priceGroupOptions.length - 1}
								rightIcon={
									<MaterialCommunityIcons
										name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
										size={24}
										color={isSelected ? primaryColor : theme.screen.icon}
									/>
								}
								handleFunction={() => handleSelectPriceGroup(option.id)}
							/>
						);
					})}
				</View>
			</ScrollView>
		</View>
	);

	const renderCompleteStep = () => (
		<View style={[styles.stepContent, { width: screenWidth }]}>
			<ScrollView contentContainerStyle={styles.stepScrollContent}>
				<MaterialCommunityIcons name="check-decagram" size={80} color={primaryColor} />
				<Text style={[styles.stepTitle, { color: theme.screen.text }]}>
					{translate(TranslationKeys.onboarding_complete)}
				</Text>
				<Text style={[styles.stepDescription, { color: theme.screen.text }]}>
					{translate(TranslationKeys.onboarding_complete_description)}
				</Text>
				<TouchableOpacity
					onPress={handleStart}
					style={[styles.startButton, { backgroundColor: primaryColor }]}
					activeOpacity={0.8}
				>
					<MaterialCommunityIcons name="rocket-launch" size={24} color={contrastColor} />
					<Text style={[styles.startButtonText, { color: contrastColor }]}>
						{translate(TranslationKeys.onboarding_start)}
					</Text>
				</TouchableOpacity>
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
			>
				{renderWelcome()}
				{renderCanteenStep()}
				{renderPriceGroupStep()}
				{renderPreferencesStep()}
				{renderCompleteStep()}
			</ScrollView>
			{renderStepIndicator()}
			<View style={[styles.navigationContainer, { borderTopColor: theme.screen.iconBg }]}>
				{!isFirstStep ? (
					<TouchableOpacity onPress={handleBack} style={styles.navButton}>
						<MaterialCommunityIcons name="chevron-left" size={24} color={theme.screen.text} />
						<Text style={[styles.navButtonText, { color: theme.screen.text }]}>
							{translate(TranslationKeys.onboarding_back)}
						</Text>
					</TouchableOpacity>
				) : (
					<View style={styles.navButton} />
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
					<View style={styles.navButton} />
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
	startButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingHorizontal: 32,
		paddingVertical: 16,
		borderRadius: 32,
		marginTop: 24,
	},
	startButtonText: {
		fontSize: 20,
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
	navButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		minWidth: 80,
	},
	navButtonText: {
		fontSize: 16,
		fontFamily: 'Poppins_400Regular',
	},
	navButtonPrimary: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 24,
	},
	navButtonPrimaryText: {
		fontSize: 16,
		fontFamily: 'Poppins_700Bold',
	},
});

export default OnboardingScreen;
