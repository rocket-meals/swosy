import { useCallback, useMemo, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { DatabaseTypes } from 'repo-depkit-common';
import { UPDATE_PROFILE } from '@/redux/Types/types';
import { ProfileHelper } from '@/redux/actions/Profile/Profile';
import { UserHelper } from '@/helper/UserHelper';
import { useAppSelector } from '@/redux/hooks';

type FavoriteEntry = DatabaseTypes.ProfilesBuildingsFavorites | string;

const resolveBuildingId = (entry: FavoriteEntry): string => {
	const id = typeof entry === 'string' ? entry : entry?.buildings_id;
	if (typeof id === 'string') return id;
	if (typeof id === 'object' && id !== null) return (id as any)?.id ? String((id as any).id) : '';
	return '';
};

/**
 * Favoriting a building works the same way as marking eating habits: the local
 * redux profile (persisted to AsyncStorage via redux-persist) is always updated
 * immediately, for anonymous and registered users alike. Only registered users
 * additionally get the change synced to the backend profile.
 */
const useBuildingFavorites = () => {
	const dispatch = useDispatch();
	const profile = useAppSelector(state => state.authReducer.profile);
	const user = useAppSelector(state => state.authReducer.user);
	const profileHelper = useMemo(() => new ProfileHelper(), []);
	const isAnonymousUser = useMemo(() => UserHelper.isAnonymousUser(user), [user]);

	// Keep a ref to avoid stale closures when profileHelper is used in async callbacks
	const profileRef = useRef(profile);
	profileRef.current = profile;

	const buildingsFavoriteIds: string[] = useMemo(() => {
		const entries = (profile?.buildings_favorites ?? []) as FavoriteEntry[];
		return entries.map(resolveBuildingId).filter((id): id is string => Boolean(id));
	}, [profile?.buildings_favorites]);

	const isBuildingFavorite = useCallback(
		(buildingId: string) => buildingsFavoriteIds.includes(buildingId),
		[buildingsFavoriteIds]
	);

	const toggleBuildingFavorite = useCallback(
		async (buildingId: string) => {
			const currentProfile = profileRef.current;
			const current = (currentProfile?.buildings_favorites ?? []) as FavoriteEntry[];
			const alreadyFavorite = current.some(entry => resolveBuildingId(entry) === buildingId);

			const updated = alreadyFavorite
				? current.filter(entry => resolveBuildingId(entry) !== buildingId)
				: [
						...current,
						{
							buildings_id: buildingId,
							...(currentProfile?.id ? { profiles_id: currentProfile.id } : {}),
						} as Partial<DatabaseTypes.ProfilesBuildingsFavorites>,
					];

			const profileData = { ...currentProfile, buildings_favorites: updated };
			dispatch({ type: UPDATE_PROFILE, payload: profileData });

			if (isAnonymousUser) return;

			try {
				await profileHelper.updateProfile(profileData);
			} catch (e) {
				console.error('Error updating buildings_favorites:', e);
				// Revert Redux state to previous value on backend failure
				dispatch({ type: UPDATE_PROFILE, payload: currentProfile });
			}
		},
		[dispatch, profileHelper, isAnonymousUser]
	);

	return { buildingsFavoriteIds, isBuildingFavorite, toggleBuildingFavorite };
};

export default useBuildingFavorites;
