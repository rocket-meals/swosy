import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
	RefreshControl,
	SafeAreaView,
	View,
	useWindowDimensions,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { CampusSortOption, CollectionNames, DatabaseTypes } from 'repo-depkit-common';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from 'expo-router';
import BuildingItem from '@/components/BuildingItem/BuildingItem';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '@/redux/hooks';
import useSelectedCanteen from '@/hooks/useSelectedCanteen';
import { CampusHelper } from '@/redux/actions/Campus/Campus';
import { SET_CAMPUSES, SET_CAMPUSES_DICT, SET_CAMPUSES_LOCAL, SET_UNSORTED_CAMPUSES } from '@/redux/Types/types';
import { BuildingsHelper } from '@/redux/actions/Buildings/Buildings';
import { calculateDistanceInMeter } from '@/helper/distanceHelper';
import DistanceModal from '@/components/DistanceModal';
import * as Location from 'expo-location';
import useToast from '@/hooks/useToast';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import useCampusSortingModal from '@/hooks/useCampusSortingModal';
import useMyScrollviewDirectusImageEditModal from '@/hooks/useMyScrollviewDirectusImageEditModal';

import { RootDrawerParamList } from './types';
import CampusHeader from './components/CampusHeader';
import CampusListHeader from './components/CampusListHeader';
import CampusEmptyState from './components/CampusEmptyState';

// Types
type BuildingWithDistance = DatabaseTypes.Buildings & { distance?: number };

const Index: React.FC = () => {
	useSetPageTitle(TranslationKeys.campus);
	const { theme } = useTheme();
	const toast = useToast();
	const dispatch = useDispatch();
	const { translate } = useLanguage();
	const { width: windowWidth } = useWindowDimensions();

	// Refs for helpers to avoid recreation
	const campusHelper = useRef(new CampusHelper()).current;
	const buildingsHelper = useRef(new BuildingsHelper()).current;

	// Local State
	const [query, setQuery] = useState<string>('');
	const [refreshing, setRefreshing] = useState(false);
	const [hasLoaded, setHasLoaded] = useState(false);
	const [loading, setLoading] = useState(true);
	const [campusesDispatched, setCampusesDispatched] = useState(false);
	const [selectedBuilding, setSelectedBuilding] = useState<DatabaseTypes.Buildings | null>(null);
	const [listWidth, setListWidth] = useState<number>(windowWidth);
	const [distanceModalVisible, setDistanceModalVisible] = useState(false);

	// Redux Selectors
	const settings = useAppSelector((state) => state.settings);
	const {
		drawerPosition,
		campusesSortBy,
		amountColumnsForcard,
		primaryColor,
		serverInfo,
		appSettings,
		selectedTheme
	} = settings;

	const { campuses, campusesLocal } = useAppSelector((state) => state.campus);
	const { isManagement } = useAppSelector((state) => state.authReducer);

	const selectedCanteen = useSelectedCanteen();
	const drawerNavigation = useNavigation<DrawerNavigationProp<RootDrawerParamList>>();

	const { openCampusSortingModal } = useCampusSortingModal();
	const { openDirectusImageEditModal } = useMyScrollviewDirectusImageEditModal();

	// Handlers
	const openDistanceSheet = useCallback(() => setDistanceModalVisible(true), []);
	const closeDistanceSheet = useCallback(() => setDistanceModalVisible(false), []);
	const toggleDrawer = useCallback(() => drawerNavigation.toggleDrawer(), [drawerNavigation]);

	// Grid Layout Logic
	const MIN_CARD_WIDTH = 280;
	const numColumns = useMemo(() => {
		if (amountColumnsForcard && amountColumnsForcard > 0) return amountColumnsForcard;
		// Use listWidth if available, else fallback to windowWidth
		const width = listWidth || windowWidth;
		if (!width) return 2;
		const cols = Math.floor(width / MIN_CARD_WIDTH);
		return Math.max(2, cols);
	}, [amountColumnsForcard, listWidth, windowWidth]);

	// Data Processing
	const ensureStableIds = useCallback((arr: DatabaseTypes.Buildings[] = []) => {
		return arr.map((c, idx) => {
			const stableId = c.id ?? `__generated__${idx}_${String(c.alias ?? '').slice(0, 10)}`;
			if (c.id === stableId) return c;
			return { ...c, id: stableId };
		});
	}, []);

	const addDistanceToList = useCallback((list: BuildingWithDistance[] | undefined, base: DatabaseTypes.Buildings | null) => {
		if (!list || !base) return list;
		try {
			const baseCoords = (base as any)?.coordinates?.coordinates as [number, number] | undefined;
			if (!Array.isArray(baseCoords) || baseCoords.length !== 2) return list;

			return list.map(c => {
				const coords = (c as any)?.coordinates?.coordinates as [number, number] | undefined;
				let dist = 0;
				if (Array.isArray(coords) && coords.length === 2) {
					dist = calculateDistanceInMeter(baseCoords, coords);
				} else if (Number.isFinite(Number((c as any)?.distance))) {
					dist = Number((c as any)?.distance);
				}

				// Only create new object if distance changed significantly or wasn't set
				if (c.distance === dist) return c;
				return { ...c, distance: dist };
			}) as BuildingWithDistance[];
		} catch (e) {
			console.warn('addDistance error', e);
			return list;
		}
	}, []);

	const fetchSelectedBuilding = useCallback(async () => {
		if (!selectedCanteen?.building) return null;
		try {
			const buildingData = (await buildingsHelper.fetchBuildingById(String(selectedCanteen.building))) as DatabaseTypes.Buildings;
			if (buildingData) {
				setSelectedBuilding(buildingData);
				return buildingData;
			}
			return null;
		} catch (e) {
			toast('Please select canteen', 'error');
			return null;
		}
	}, [buildingsHelper, selectedCanteen, toast]);

	const fetchAllCampuses = useCallback(
		async (baseBuilding: DatabaseTypes.Buildings | null = null) => {
			try {
				setLoading(true);
				const campusDataRaw = (await campusHelper.fetchCampus({})) as DatabaseTypes.Buildings[] | undefined;
				const campusData = ensureStableIds(campusDataRaw ?? []);

				const dict = campusData.reduce((acc: Record<string, DatabaseTypes.Buildings>, campus) => {
					if (campus?.id) acc[campus.id] = campus;
					return acc;
				}, {});

				const campusDataWithDistance: BuildingWithDistance[] = baseBuilding
					? (addDistanceToList(campusData as BuildingWithDistance[], baseBuilding) ?? (campusData as BuildingWithDistance[]))
					: (campusData as BuildingWithDistance[]).map(c => ({
							...c,
							distance: Number.isFinite(Number((c as any)?.distance)) ? Number((c as any)?.distance) : 0,
					  }));

				dispatch({ type: SET_CAMPUSES, payload: campusDataWithDistance });
				dispatch({ type: SET_CAMPUSES_DICT, payload: dict });
				dispatch({ type: SET_UNSORTED_CAMPUSES, payload: campusDataWithDistance });
				dispatch({ type: SET_CAMPUSES_LOCAL, payload: campusDataWithDistance });

				setCampusesDispatched(true);
				setHasLoaded(true);
			} catch (e) {
				console.error('fetchAllCampuses error', e);
				toast('Failed to load campuses', 'error');
			} finally {
				setLoading(false);
			}
		},
		[campusHelper, dispatch, ensureStableIds, addDistanceToList, toast]
	);

	// Effects
	useEffect(() => {
		let mounted = true;
		(async () => {
			setLoading(true);
			const base = await fetchSelectedBuilding();
			if (mounted) await fetchAllCampuses(base ?? null);
			if (mounted) setLoading(false);
		})();
		return () => { mounted = false; };
	}, []); // Run once

	// Update distance when selectedBuilding changes
	useEffect(() => {
		if (!campusesDispatched || !selectedBuilding) return;

		const nextList = addDistanceToList(campusesLocal ?? [], selectedBuilding);
		if (nextList) {
			// Check for equality more robustly if needed, but keeping original logic structure for safety
			const equal = (campuses ?? []).length === nextList.length &&
						  (campuses ?? []).every((c, i) => String(c?.id ?? '') === String(nextList[i]?.id ?? ''));

			if (!equal) {
				dispatch({ type: SET_CAMPUSES, payload: nextList });
				dispatch({ type: SET_UNSORTED_CAMPUSES, payload: nextList });
			}
		}
	}, [selectedBuilding, campusesDispatched, addDistanceToList, campusesLocal, campuses, dispatch]);

	// Sorting Logic
	const sortCampuses = useCallback((list: BuildingWithDistance[], sortBy: CampusSortOption) => {
		 const newList = [...list];
		 if (sortBy === CampusSortOption.ALPHABETICAL) {
			 return newList.sort((a, b) => (a?.alias ?? '').localeCompare(b?.alias ?? ''));
		 } else if (sortBy === CampusSortOption.DISTANCE || sortBy === CampusSortOption.INTELLIGENT) {
			 return newList.sort((a, b) => (a?.distance || 0) - (b?.distance || 0));
		 }
		 return newList;
	}, []);

	useEffect(() => {
		if (!campuses || campuses.length === 0) return;

		const sorted = sortCampuses(campuses as BuildingWithDistance[], campusesSortBy);

		// Simple equality check to avoid infinite loops
		const same = sorted.length === campuses.length &&
					 sorted.every((c, i) => String(c?.id ?? '') === String(campuses[i]?.id ?? ''));

		if (!same) {
			dispatch({ type: SET_CAMPUSES, payload: sorted });
			dispatch({ type: SET_CAMPUSES_LOCAL, payload: sorted });
		}
	}, [campusesSortBy, campuses, sortCampuses, dispatch]);

	// Filtering
	const visibleCampuses: BuildingWithDistance[] = useMemo(() => {
		const src: BuildingWithDistance[] = (campusesLocal as BuildingWithDistance[]) ?? (campuses as BuildingWithDistance[]) ?? [];
		if (!query || query.trim() === '') return src;
		const q = query.toLowerCase().trim();
		return src.filter(campus => (campus?.alias ?? '').toLowerCase().includes(q));
	}, [campusesLocal, campuses, query]);

	const onRefresh = useCallback(() => {
		setRefreshing(true);
		fetchAllCampuses(selectedBuilding ?? null).finally(() => setRefreshing(false));
	}, [fetchAllCampuses, selectedBuilding]);

	const useCurrentLocationForDistance = useCallback(async () => {
		try {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== 'granted') {
				toast('Permission denied', 'error');
				return;
			}
			const loc = await Location.getCurrentPositionAsync({});
			const fakeBuilding = { coordinates: { coordinates: [loc.coords.longitude, loc.coords.latitude] } } as any;
			setSelectedBuilding(fakeBuilding);
			closeDistanceSheet();
		} catch (error) {
			console.error('Error getting location:', error);
		}
	}, [toast, closeDistanceSheet]);

	// Image Management
	const openImageManagementModal = useCallback(
		(campus: DatabaseTypes.Buildings) => {
			if (!campus?.id) return;
			openDirectusImageEditModal({
				itemId: campus.id,
				field: 'image',
				collection: CollectionNames.BUILDINGS,
				onUpdated: () => {
					setCampusesDispatched(false);
					fetchAllCampuses();
				},
			});
		},
		[fetchAllCampuses, openDirectusImageEditModal]
	);

	// Memoized Props for Item
	const settingsForItem = useMemo(() => ({
		amountColumnsForcard,
		primaryColor,
		serverInfo,
		appSettings,
		selectedTheme,
		screenWidth: windowWidth,
		isManagement,
	}), [amountColumnsForcard, primaryColor, serverInfo, appSettings, selectedTheme, windowWidth, isManagement]);

	const renderItem = useCallback(
		({ item }: { item: BuildingWithDistance }) => {
			return (
				<View style={styles.campusContainerItem}>
					<BuildingItem
						campus={item}
						onEditImage={openImageManagementModal}
						openDistanceSheet={openDistanceSheet}
						settings={settingsForItem}
					/>
				</View>
			);
		},
		[openImageManagementModal, openDistanceSheet, settingsForItem]
	);

	const keyExtractor = useCallback((item: BuildingWithDistance, index: number) => (item.id ? String(item.id) : `campus-${index}`), []);

	const widthStyle = useMemo(() => ({
		width: windowWidth > 768 ? Math.floor(windowWidth * 0.6) : Math.floor(windowWidth)
	}), [windowWidth]);

	const headerComponent = useMemo(() => (
		<CampusListHeader
			widthStyle={widthStyle}
			theme={theme}
			query={query}
			setQuery={setQuery}
			translate={translate}
		/>
	), [widthStyle, theme, query, translate, setQuery]); // Added setQuery

	const emptyComponent = useMemo(() => (
		<CampusEmptyState loading={loading} theme={theme} translate={translate} />
	), [loading, theme, translate]);

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.screen.background }}>
			<View style={styles.container}>
				<CampusHeader
					theme={theme}
					translate={translate}
					onToggleDrawer={toggleDrawer}
					onSort={openCampusSortingModal}
					drawerPosition={drawerPosition}
				/>

				<View style={{ flex: 1, alignItems: 'center' }}>
					<View
						style={{
							width: '100%',
							maxWidth: 1420,
							flex: 1,
						}}
						onLayout={e => {
							const w = e.nativeEvent.layout.width;
							if (w && w !== listWidth) {
								setListWidth(w);
							}
						}}
					>
						<FlashList
							key={`list-${numColumns}`}
							data={visibleCampuses}
							renderItem={renderItem}
							keyExtractor={keyExtractor}
							numColumns={numColumns}
							contentContainerStyle={{ marginTop: 20 }}
							ListHeaderComponent={headerComponent}
							ListEmptyComponent={emptyComponent}
							refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
							removeClippedSubviews={true}
							showsVerticalScrollIndicator={false}
							// @ts-ignore: estimatedItemSize is missing in the type definition but required for performance
							estimatedItemSize={250}
							onEndReachedThreshold={0.4}
						/>
					</View>
				</View>

				<DistanceModal visible={distanceModalVisible} onClose={closeDistanceSheet} onUseCurrentPosition={useCurrentLocationForDistance} />
			</View>
		</SafeAreaView>
	);
};

export default Index;
