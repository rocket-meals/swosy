import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, SafeAreaView, useWindowDimensions, View } from 'react-native';
import { CollectionNames, DatabaseTypes } from 'repo-depkit-common';
import { FlashList } from '@shopify/flash-list';
import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import { useDispatch } from 'react-redux';

import {
	SET_APARTMENTS,
	SET_APARTMENTS_DICT,
	SET_APARTMENTS_LOCAL,
	SET_UNSORTED_APARTMENTS,
} from '@/redux/Types/types';
import { ApartmentsHelper } from '@/redux/actions/Apartments/Apartments';
import { BuildingsHelper } from '@/redux/actions/Buildings/Buildings';
import { useAppSelector } from '@/redux/hooks';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import useSelectedCanteen from '@/hooks/useSelectedCanteen';
import useToast from '@/hooks/useToast';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import useHousingSortingModal from '@/hooks/useHousingSortingModal';
import useMyScrollviewDirectusImageEditModal from '@/hooks/useMyScrollviewDirectusImageEditModal';
import { TranslationKeys } from '@/locales/keys';
import ApartmentItem from '@/components/ApartmentItem/ApartmentItem';
import DistanceModal from '@/components/DistanceModal';

import styles from './styles';
import { addDistanceToApartments, getSortedApartments } from './utils';
import HousingHeader from './components/HousingHeader';
import HousingListHeader from './components/HousingListHeader';
import HousingListEmpty from './components/HousingListEmpty';

const MIN_CARD_WIDTH = 280;
const apartmentsHelper = new ApartmentsHelper();
const buildingsHelper = new BuildingsHelper();

const Index: React.FC = () => {
	useSetPageTitle(TranslationKeys.housing);
	const toast = useToast();
	const { translate } = useLanguage();
	const { theme } = useTheme();
	const dispatch = useDispatch();
	const { width: screenWidth } = useWindowDimensions();

	// Global State
	const {
		drawerPosition,
		apartmentsSortBy,
		primaryColor: projectColor,
		appSettings,
		language,
		amountColumnsForcard,
	} = useAppSelector((state) => state.settings);
	const { unSortedApartments } = useAppSelector((state) => state.apartment);
	const selectedCanteen = useSelectedCanteen();

	// Local State
	const [query, setQuery] = useState<string>('');
	const [loading, setLoading] = useState(true);
	const [isActive, setIsActive] = useState(false);
	const [distanceModalVisible, setDistanceModalVisible] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [selectedBuilding, setSelectedBuilding] = useState<DatabaseTypes.Buildings | null>();
	const [listWidth, setListWidth] = useState<number | null>(null);

	// Helpers
	const { openHousingSortingModal } = useHousingSortingModal();
	const { openDirectusImageEditModal } = useMyScrollviewDirectusImageEditModal();

	const housingAreaColor = appSettings?.housing_area_color
		? appSettings?.housing_area_color
		: projectColor;

	// Callbacks
	const openDistanceSheet = useCallback(() => {
		setDistanceModalVisible(true);
	}, []);

	const closeDistanceSheet = useCallback(() => {
		setDistanceModalVisible(false);
	}, []);

	useFocusEffect(
		useCallback(() => {
			setIsActive(true);
			return () => {
				setIsActive(false);
			};
		}, [])
	);

	const fetchAllApartments = useCallback(async () => {
		setLoading(true);
		try {
			const apartmentData = (await apartmentsHelper.fetchApartments({})) as DatabaseTypes.Apartments[];
			const list = apartmentData || [];

			const apartmentWithBuilding = await Promise.all(
				list.map(async (apartment) => {
					const buildingData = (await buildingsHelper.fetchBuildingById(
						String(apartment?.building)
					)) as DatabaseTypes.Buildings;

					return {
						...apartment,
						...buildingData,
					};
				})
			);

			const apartmentsDict = apartmentWithBuilding.reduce((acc, apt: any) => {
				if (apt.id) {
					acc[apt.id] = apt;
				}
				return acc;
			}, {} as Record<string, any>);

			// We update Redux to keep the store consistent, but we rely on unSortedApartments for local logic
			dispatch({ type: SET_APARTMENTS, payload: apartmentWithBuilding });
			dispatch({ type: SET_UNSORTED_APARTMENTS, payload: apartmentWithBuilding });
			dispatch({ type: SET_APARTMENTS_LOCAL, payload: apartmentWithBuilding });
			dispatch({ type: SET_APARTMENTS_DICT, payload: apartmentsDict });
		} catch (error) {
			console.error('Error fetching apartments or buildings:', error);
			toast('Failed to load apartments', 'error');
		} finally {
			setLoading(false);
		}
	}, [dispatch, toast]);

	const onRefresh = useCallback(() => {
		setRefreshing(true);
		fetchAllApartments().finally(() => {
			setRefreshing(false);
		});
	}, [fetchAllApartments]);

	const fetchSelectedBuilding = useCallback(async () => {
		if (selectedCanteen?.building) {
			const buildingData = (await buildingsHelper.fetchBuildingById(
				String(selectedCanteen.building)
			)) as DatabaseTypes.Buildings;
			const building = buildingData || [];
			if (building) {
				setSelectedBuilding(building);
			}
		} else {
			// toast('Please select canteen', 'error'); // Optional: suppressing this error on mount if not selected
		}
	}, [selectedCanteen]);

	const useCurrentLocationForDistance = useCallback(async () => {
		try {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== 'granted') {
				toast('Permission denied', 'error');
				return;
			}
			const loc = await Location.getCurrentPositionAsync({});
			setSelectedBuilding({
				coordinates: { coordinates: [loc.coords.longitude, loc.coords.latitude] },
			} as any);
			closeDistanceSheet();
		} catch (error) {
			console.error('Error getting location:', error);
		}
	}, [closeDistanceSheet, toast]);

	const openImageManagementModal = useCallback(
		(apartment: DatabaseTypes.Apartments) => {
			if (!apartment?.id) return;
			const buildingId =
				typeof apartment.building === 'object' ? apartment.building?.id : apartment.building;
			if (!buildingId) return;
			openDirectusImageEditModal({
				itemId: buildingId,
				field: 'image',
				collection: CollectionNames.BUILDINGS,
				onUpdated: () => {
					fetchAllApartments();
				},
			});
		},
		[fetchAllApartments, openDirectusImageEditModal]
	);

	// Effects
	useEffect(() => {
		fetchSelectedBuilding();
		fetchAllApartments();
	}, []); // Run once on mount

	// Computed Data
	const apartmentsWithDistance = useMemo(() => {
		return addDistanceToApartments(unSortedApartments || [], selectedBuilding);
	}, [unSortedApartments, selectedBuilding]);

	const sortedApartments = useMemo(() => {
		// If apartmentsSortBy is null/undefined, getSortedApartments handles default
		// Note: We cast to any because ApartmentSortOption enum might not match exactly if Redux state is loose
		return getSortedApartments(apartmentsWithDistance, apartmentsSortBy as any);
	}, [apartmentsWithDistance, apartmentsSortBy]);

	const visibleApartments = useMemo(() => {
		if (!query || query.trim() === '') return sortedApartments;
		const q = query.toLowerCase().trim();
		return sortedApartments.filter((apartment: any) =>
			(apartment?.alias ?? '').toLowerCase().includes(q)
		);
	}, [sortedApartments, query]);

	const numColumns = useMemo(() => {
		if (amountColumnsForcard && amountColumnsForcard > 0) {
			return amountColumnsForcard;
		}
		if (!listWidth) return 2;
		const cols = Math.floor(listWidth / MIN_CARD_WIDTH);
		return Math.max(2, cols);
	}, [amountColumnsForcard, listWidth]);

	// Render Helpers
	const renderItem = useCallback(
		({ item }: { item: any }) => (
			<View style={styles.itemContainer}>
				<ApartmentItem
					apartment={item}
					onEditImage={openImageManagementModal}
					openDistanceSheet={openDistanceSheet}
				/>
			</View>
		),
		[openImageManagementModal, openDistanceSheet]
	);

	const keyExtractor = useCallback(
		(item: any, index: number) => (item.id ? String(item.id) : `apartment-${index}`),
		[]
	);

	const ListHeader = useMemo(
		() => (
			<HousingListHeader
				screenWidth={screenWidth}
				appSettings={appSettings}
				language={language}
				housingAreaColor={housingAreaColor}
				theme={theme}
				query={query}
				setQuery={setQuery}
				translate={translate}
			/>
		),
		[screenWidth, appSettings, language, housingAreaColor, theme, query, translate]
	);

	const ListEmpty = useMemo(
		() => <HousingListEmpty loading={loading} theme={theme} />,
		[loading, theme]
	);

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: theme.screen.background }]}>
			<View style={styles.container}>
				<HousingHeader
					theme={theme}
					translate={translate}
					drawerPosition={drawerPosition}
					openHousingSortingModal={openHousingSortingModal}
				/>

				<View style={{ flex: 1, alignItems: 'center' }}>
					<View
						style={{
							width: '100%',
							maxWidth: 1420,
							flex: 1,
						}}
						onLayout={(e) => {
							const w = e.nativeEvent.layout.width;
							if (w && w !== listWidth) {
								setListWidth(w);
							}
						}}
					>
						<FlashList
							key={numColumns}
							data={visibleApartments}
							renderItem={renderItem}
							keyExtractor={keyExtractor}
							numColumns={numColumns}
							// @ts-ignore
							estimatedItemSize={300}
							contentContainerStyle={{
								paddingHorizontal: 5,
								paddingBottom: 20,
							}}
							ListHeaderComponent={ListHeader}
							ListEmptyComponent={ListEmpty}
							refreshControl={
								<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
							}
							removeClippedSubviews={false} // FlashList handles this, sometimes true is better but original was false
							showsVerticalScrollIndicator={false}
							onEndReachedThreshold={0.4}
						/>
					</View>
				</View>
				{isActive && (
					<DistanceModal
						visible={distanceModalVisible}
						onClose={closeDistanceSheet}
						onUseCurrentPosition={useCurrentLocationForDistance}
					/>
				)}
			</View>
		</SafeAreaView>
	);
};

export default Index;
