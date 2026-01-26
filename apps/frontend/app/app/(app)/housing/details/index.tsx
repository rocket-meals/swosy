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
	const {
		appSettings,
		serverInfo,
		primaryColor,
		selectedTheme: mode,
	} = useAppSelector((state) => state.settings);
	const { apartmentsDict } = useAppSelector((state) => state.apartment);

	// Local State
	const [activeTab, setActiveTab] = useState('information');

	// Derived State
	const apartmentDetails = useMemo(() => {
		if (!id) return null;
		return apartmentsDict[String(id)] || null;
	}, [apartmentsDict, id]);

	const defaultImage = useMemo(
		() => getImageUrl(serverInfo?.info?.project?.project_logo),
		[serverInfo]
	);

	const housingAreaColor = useMemo(
		() => (appSettings?.housing_area_color ? appSettings?.housing_area_color : primaryColor),
		[appSettings, primaryColor]
	);

	const contrastColor = useMemo(
		() => myContrastColor(housingAreaColor, theme, mode === 'dark'),
		[housingAreaColor, theme, mode]
	);

	const themeStyles = useMemo(
		() => ({
			backgroundColor: housingAreaColor,
			borderColor: housingAreaColor,
			color: contrastColor,
		}),
		[housingAreaColor, contrastColor]
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
					<HousingDetailsImage
						apartmentDetails={apartmentDetails}
						screenWidth={screenWidth}
						defaultImage={defaultImage || ''}
					/>

					<View style={[styles.detailsContainer, { width: '100%' }]}>
						<HousingDetailsHeader
							apartmentDetails={apartmentDetails}
							theme={theme}
							screenWidth={screenWidth}
							translate={translate}
							onOpenNavigation={handleOpenNavigation}
						/>

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
