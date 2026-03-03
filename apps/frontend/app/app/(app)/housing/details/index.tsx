import React, { useCallback, useMemo, useState } from 'react';
import {
	ActivityIndicator,
	DimensionValue,
	SafeAreaView,
	ScrollView,
	View,
	useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAppSelector } from '@/redux/hooks';
import { getImageUrl } from '@/constants/HelperFunctions';
import { myContrastColor } from '@/helper/ColorHelper';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import useLinkCoordinateModal from '@/hooks/useLinkCoordinateModal';
import { TranslationKeys } from '@/locales/keys';
import { shallowEqual } from 'react-redux';

import styles from './styles';
import HousingDetailsImage from './components/HousingDetailsImage';
import HousingDetailsHeader from './components/HousingDetailsHeader';
import HousingDetailsTabs from './components/HousingDetailsTabs';
import HousingDetailsContent from './components/HousingDetailsContent';

const Details = () => {
	useSetPageTitle(TranslationKeys.apartment_details);
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const { openLinkCoordinateModal } = useLinkCoordinateModal();
	const { id } = useLocalSearchParams();
	const { width: screenWidth } = useWindowDimensions();

	// Redux State
	// Optimize selectors to avoid selecting large objects
	const housingAreaColor = useAppSelector((state) => state.settings.appSettings?.housing_area_color);
	const projectLogo = useAppSelector((state) => state.settings.serverInfo?.info?.project?.project_logo);
	const primaryColor = useAppSelector((state) => state.settings.primaryColor);
	const mode = useAppSelector((state) => state.settings.selectedTheme);

	// Local State
	const [activeTab, setActiveTab] = useState('information');

	// Derived State
	const apartmentDetails = useAppSelector((state) => {
		if (!id) return null;
		return state.apartment.apartmentsDict[String(id)] || null;
	}, shallowEqual);

	const defaultImage = useMemo(
		() => getImageUrl(projectLogo),
		[projectLogo]
	);

	const housingAreaColorFinal = useMemo(
		() => (housingAreaColor ? housingAreaColor : primaryColor),
		[housingAreaColor, primaryColor]
	);

	const contrastColor = useMemo(
		() => myContrastColor(housingAreaColorFinal, theme, mode === 'dark'),
		[housingAreaColorFinal, theme, mode]
	);

	const themeStyles = useMemo(
		() => ({
			backgroundColor: housingAreaColorFinal,
			borderColor: housingAreaColorFinal,
			color: contrastColor,
		}),
		[housingAreaColorFinal, contrastColor]
	);

	// Handlers
	const handleOpenNavigation = useCallback(() => {
		if (!apartmentDetails) return;
		const coordinates = (apartmentDetails as any).coordinates?.coordinates; // [longitude, latitude]

		if (!coordinates || coordinates.length !== 2) {
			console.error('Invalid coordinates');
			return;
		}

		const [longitude, latitude] = coordinates;
		openLinkCoordinateModal({
			latlon: { latitude, longitude },
		});
	}, [apartmentDetails, openLinkCoordinateModal]);

	const containerStyle = useMemo(
		() => ({
			...styles.contentContainer,
			paddingHorizontal: screenWidth > 900 ? 20 : 10,
		}),
		[screenWidth]
	);

	const buildingContainerStyle = useMemo(
		() => ({
			...styles.bulidingContainer,
			width: (screenWidth > 1000 ? '80%' : '100%') as DimensionValue,
			flexDirection: 'column' as const,
		}),
		[screenWidth]
	);

	const pagerViewStyle = useMemo(
		() => ({
			...styles.pagerView,
			width: (screenWidth > 900 ? '95%' : '100%') as DimensionValue,
			paddingHorizontal: screenWidth > 900 ? 20 : 0,
		}),
		[screenWidth]
	);

	// Memoize static content to prevent re-renders when activeTab changes
	const imageSection = useMemo(() => (
		<HousingDetailsImage
			apartmentDetails={apartmentDetails}
			screenWidth={screenWidth}
			defaultImage={defaultImage || ''}
		/>
	), [apartmentDetails, screenWidth, defaultImage]);

	const headerSection = useMemo(() => (
		<HousingDetailsHeader
			apartmentDetails={apartmentDetails}
			theme={theme}
			screenWidth={screenWidth}
			translate={translate}
			onOpenNavigation={handleOpenNavigation}
		/>
	), [apartmentDetails, theme, screenWidth, translate, handleOpenNavigation]);

	if (!apartmentDetails) {
		return (
			<SafeAreaView style={[styles.safeAreaContainer, { backgroundColor: theme.screen.background }]}>
				<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
					<ActivityIndicator size="large" color={theme.screen.text} />
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={[styles.safeAreaContainer, { backgroundColor: theme.screen.background }]}>
			<ScrollView
				style={[styles.container, { backgroundColor: theme.screen.background }]}
				contentContainerStyle={containerStyle}
				showsVerticalScrollIndicator={false}
			>
				<View style={buildingContainerStyle}>
					{imageSection}

					<View style={[styles.detailsContainer, { width: '100%' }]}>
						{headerSection}

						<View style={[styles.tabViewContainer, { width: '100%' }]}>
							<HousingDetailsTabs
								activeTab={activeTab}
								setActiveTab={setActiveTab}
								theme={theme}
								themeStyles={themeStyles}
								contrastColor={contrastColor}
								translate={translate}
								apartmentDetails={apartmentDetails}
								screenWidth={screenWidth}
							/>

							<View style={pagerViewStyle}>
								<HousingDetailsContent
									activeTab={activeTab}
									apartmentDetails={apartmentDetails}
								/>
							</View>
						</View>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
};

export default Details;
