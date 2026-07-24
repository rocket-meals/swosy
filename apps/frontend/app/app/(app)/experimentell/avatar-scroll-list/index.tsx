import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, DimensionValue, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { CollectionHelper } from '@/helper/collectionHelper';
import { DatabaseTypes } from 'repo-depkit-common';
import { MyAvatar } from 'repo-depkit-common-ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { parseProfileAvatar, AVATAR_BACKGROUND } from '@/hooks/useAvatarProfileEditor';

const PAGE_SIZE = 24;
const AVATAR_RENDER_SIZE = 80;
const MIN_ITEM_WIDTH = 110;

const profilesHelper = new CollectionHelper<DatabaseTypes.Profiles>('profiles');

// Only the fields needed for the list are requested to keep each page small.
// Sorted by id so that offset-based pagination stays stable while scrolling.
async function fetchProfilesPage(offset: number): Promise<DatabaseTypes.Profiles[]> {
	return await profilesHelper.readItems({
		fields: ['id', 'nickname', 'avatar'],
		sort: ['id'],
		limit: PAGE_SIZE,
		offset,
	});
}

const AvatarScrollListScreen = () => {
	useSetPageTitle(TranslationKeys.avatar_scroll_list);
	const { theme } = useTheme();
	const { translate } = useLanguage();

	const [profiles, setProfiles] = useState<DatabaseTypes.Profiles[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
	// Guards against parallel page loads (onEndReached can fire multiple times while scrolling).
	const loadingMoreRef = useRef(false);

	useEffect(() => {
		const handleResize = () => setScreenWidth(Dimensions.get('window').width);
		const subscription = Dimensions.addEventListener('change', handleResize);
		return () => subscription?.remove();
	}, []);

	const numColumns = useMemo(() => {
		return Math.max(2, Math.min(6, Math.floor(screenWidth / MIN_ITEM_WIDTH)));
	}, [screenWidth]);

	const appendUniqueProfiles = useCallback((prev: DatabaseTypes.Profiles[], page: DatabaseTypes.Profiles[]) => {
		const knownIds = new Set(prev.map((p) => p.id));
		return [...prev, ...page.filter((p) => !knownIds.has(p.id))];
	}, []);

	const loadInitial = useCallback(async () => {
		try {
			const page = await fetchProfilesPage(0);
			setProfiles(page);
			setHasMore(page.length === PAGE_SIZE);
		} catch (e) {
			console.error('[AvatarScrollList] Error loading profiles', e);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadInitial();
	}, [loadInitial]);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await loadInitial();
		setRefreshing(false);
	}, [loadInitial]);

	const loadMore = useCallback(async () => {
		if (loadingMoreRef.current || !hasMore || loading) return;
		loadingMoreRef.current = true;
		setLoadingMore(true);
		try {
			const page = await fetchProfilesPage(profiles.length);
			setProfiles((prev) => appendUniqueProfiles(prev, page));
			setHasMore(page.length === PAGE_SIZE);
		} catch (e) {
			console.error('[AvatarScrollList] Error loading more profiles', e);
		} finally {
			loadingMoreRef.current = false;
			setLoadingMore(false);
		}
	}, [hasMore, loading, profiles.length, appendUniqueProfiles]);

	const renderProfile = useCallback(
		({ item }: { item: DatabaseTypes.Profiles }) => {
			const avatarConfig = parseProfileAvatar(item.avatar);
			const displayName = item.nickname || `#${String(item.id).slice(0, 8)}`;
			return (
				<View style={[styles.profileItem, { width: (100 / numColumns + '%') as DimensionValue }]}>
					{avatarConfig ? (
						<MyAvatar
							style={avatarConfig.style}
							options={avatarConfig.options}
							size={AVATAR_RENDER_SIZE}
							rounded={true}
							backgroundColor={AVATAR_BACKGROUND}
						/>
					) : (
						<View style={[styles.placeholderAvatar, { borderColor: theme.screen.text + '33' }]}>
							<MaterialCommunityIcons name="account-outline" size={AVATAR_RENDER_SIZE / 2} color={theme.screen.text + '66'} />
						</View>
					)}
					<Text style={[styles.profileName, { color: theme.screen.text }]} numberOfLines={1}>
						{displayName}
					</Text>
				</View>
			);
		},
		[numColumns, theme.screen.text]
	);

	if (loading) {
		return (
			<View style={[styles.loader, { backgroundColor: theme.screen.background }]}>
				<ActivityIndicator />
			</View>
		);
	}

	return (
		<FlatList
			// Changing numColumns on the fly is not supported by FlatList, so remount on change.
			key={`avatar-grid-${numColumns}`}
			data={profiles}
			keyExtractor={(item) => String(item.id)}
			renderItem={renderProfile}
			numColumns={numColumns}
			onEndReached={loadMore}
			onEndReachedThreshold={0.5}
			refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
			scrollEventThrottle={16}
			style={{ flex: 1, backgroundColor: theme.screen.background }}
			contentContainerStyle={styles.listContent}
			ListEmptyComponent={
				<Text style={[styles.emptyText, { color: theme.screen.text }]}>
					{translate(TranslationKeys.no_data_currently_calculating)}
				</Text>
			}
			ListFooterComponent={
				loadingMore ? (
					<View style={styles.footerLoader}>
						<ActivityIndicator />
					</View>
				) : null
			}
		/>
	);
};

const styles = StyleSheet.create({
	loader: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	listContent: {
		paddingVertical: 16,
		paddingHorizontal: 8,
	},
	profileItem: {
		alignItems: 'center',
		paddingVertical: 12,
		paddingHorizontal: 4,
	},
	placeholderAvatar: {
		width: AVATAR_RENDER_SIZE,
		height: AVATAR_RENDER_SIZE,
		borderRadius: AVATAR_RENDER_SIZE / 2,
		borderWidth: 2,
		borderStyle: 'dashed',
		alignItems: 'center',
		justifyContent: 'center',
	},
	profileName: {
		marginTop: 8,
		fontSize: 14,
		textAlign: 'center',
		maxWidth: '100%',
	},
	emptyText: {
		textAlign: 'center',
		paddingVertical: 32,
	},
	footerLoader: {
		paddingVertical: 16,
		alignItems: 'center',
	},
});

export default AvatarScrollListScreen;
