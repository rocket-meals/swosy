import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { useAppSelector } from '@/redux/hooks';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import CanteenSelection from '@/components/CanteenSelection/CanteenSelection';
import SettingsListMarkingLabelFast from '@/components/SettingsListMarkingLabelFast';
import { SET_SELECTED_CANTEEN, SET_BUILDINGS_DICT, SET_CANTEENS } from '@/redux/Types/types';
import { DatabaseTypes } from 'repo-depkit-common';
import { CanteenHelper } from '@/redux/actions';
import { BuildingsHelper } from '@/redux/actions/Buildings/Buildings';
import { getImageUrl } from '@/constants/HelperFunctions';
import { myContrastColor } from '@/helper/ColorHelper';
import ProjectButton from '@/components/ProjectButton';

const STEPS = ['welcome', 'canteen', 'preferences', 'notifications', 'complete'] as const;
type Step = typeof STEPS[number];

const OnboardingScreen = () => {
	useSetPageTitle(TranslationKeys.onboarding);
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const dispatch = useDispatch();
	const { primaryColor, selectedTheme: mode, serverInfo } = useAppSelector((state) => state.settings);
	const { canteens, selectedCanteen } = useAppSelector((state) => state.canteenReducer);
	const { markings } = useAppSelector((state) => state.food);
	const { isManagement } = useAppSelector((state) => state.authReducer);
	const contrastColor = myContrastColor(primaryColor, theme, mode === 'dark');

	const [currentStepIndex, setCurrentStepIndex] = useState(0);
	const [notificationsEnabled, setNotificationsEnabled] = useState(false);

	const currentStep = STEPS[currentStepIndex];
	const isFirstStep = currentStepIndex === 0;
	const isLastStep = currentStepIndex === STEPS.length - 1;

	const canteenHelper = useMemo(() => new CanteenHelper(), []);
	const buildingsHelper = useMemo(() => new BuildingsHelper(), []);

	useEffect(() => {
		const loadCanteens = async () => {
			try {
				const buildingsData = (await buildingsHelper.fetchBuildings({})) as DatabaseTypes.Buildings[];
				const buildings = buildingsData || [];
				const buildingsDict = buildings.reduce((acc: Record<string, any>, building: any) => {
					acc[building.id] = building;
					return acc;
				}, {});
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
	}, [isManagement]);

	const handleNext = useCallback(() => {
		if (!isLastStep) {
			setCurrentStepIndex((prev) => prev + 1);
		}
	}, [isLastStep]);

	const handleBack = useCallback(() => {
		if (!isFirstStep) {
			setCurrentStepIndex((prev) => prev - 1);
		}
	}, [isFirstStep]);

	const handleSelectCanteen = useCallback((canteen: DatabaseTypes.Canteens) => {
		dispatch({ type: SET_SELECTED_CANTEEN, payload: canteen });
	}, [dispatch]);

	const handleToggleNotifications = useCallback(async () => {
		if (Platform.OS !== 'web') {
			try {
				const Notifications = await import('expo-notifications');
				const { status } = await Notifications.requestPermissionsAsync();
				setNotificationsEnabled(status === 'granted');
			} catch {
				setNotificationsEnabled(!notificationsEnabled);
			}
		} else {
			setNotificationsEnabled(!notificationsEnabled);
		}
	}, [notificationsEnabled]);

	const markingIds = useMemo(() => (markings ?? []).map((m: DatabaseTypes.Markings) => m.id), [markings]);

	const renderStepIndicator = () => (
		<View style={styles.stepIndicatorContainer}>
			{STEPS.map((_, index) => (
				<View
					key={index}
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
		<View style={styles.stepContent}>
			<MaterialCommunityIcons name="rocket-launch" size={80} color={primaryColor} />
			<Text style={[styles.stepTitle, { color: theme.screen.text }]}>
				{translate(TranslationKeys.onboarding_welcome)}
			</Text>
			<Text style={[styles.stepDescription, { color: theme.screen.text }]}>
				{translate(TranslationKeys.onboarding_welcome_description)}
			</Text>
		</View>
	);

	const renderCanteenStep = () => (
		<View style={styles.stepContent}>
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
		</View>
	);

	const renderPreferencesStep = () => (
		<View style={styles.stepContent}>
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
		</View>
	);

	const renderNotificationsStep = () => (
		<View style={styles.stepContent}>
			<MaterialCommunityIcons
				name={notificationsEnabled ? 'bell-ring' : 'bell-outline'}
				size={64}
				color={primaryColor}
			/>
			<Text style={[styles.stepTitle, { color: theme.screen.text }]}>
				{translate(TranslationKeys.onboarding_notifications)}
			</Text>
			<Text style={[styles.stepDescription, { color: theme.screen.text }]}>
				{translate(TranslationKeys.onboarding_notifications_description)}
			</Text>
			<ProjectButton
				text={translate(TranslationKeys.onboarding_enable_notifications)}
				onPress={handleToggleNotifications}
				style={[
					styles.notificationButton,
					notificationsEnabled && { backgroundColor: primaryColor },
				]}
			/>
			{notificationsEnabled && (
				<View style={styles.enabledIndicator}>
					<MaterialCommunityIcons name="check-circle" size={24} color={primaryColor} />
					<Text style={[styles.enabledText, { color: primaryColor }]}>
						{translate(TranslationKeys.checked)}
					</Text>
				</View>
			)}
		</View>
	);

	const renderCompleteStep = () => (
		<View style={styles.stepContent}>
			<MaterialCommunityIcons name="check-decagram" size={80} color={primaryColor} />
			<Text style={[styles.stepTitle, { color: theme.screen.text }]}>
				{translate(TranslationKeys.onboarding_complete)}
			</Text>
			<Text style={[styles.stepDescription, { color: theme.screen.text }]}>
				{translate(TranslationKeys.onboarding_complete_description)}
			</Text>
		</View>
	);

	const renderCurrentStep = () => {
		switch (currentStep) {
			case 'welcome':
				return renderWelcome();
			case 'canteen':
				return renderCanteenStep();
			case 'preferences':
				return renderPreferencesStep();
			case 'notifications':
				return renderNotificationsStep();
			case 'complete':
				return renderCompleteStep();
		}
	};

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: theme.screen.background }]}>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				style={{ backgroundColor: theme.screen.background }}
			>
				{renderStepIndicator()}
				{renderCurrentStep()}
			</ScrollView>
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
	scrollContent: {
		flexGrow: 1,
		padding: 20,
	},
	stepIndicatorContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 8,
		marginBottom: 24,
		marginTop: 12,
	},
	stepDot: {
		height: 8,
		borderRadius: 4,
	},
	stepContent: {
		flex: 1,
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
	notificationButton: {
		marginVertical: 16,
	},
	enabledIndicator: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	enabledText: {
		fontSize: 16,
		fontFamily: 'Poppins_400Regular',
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
