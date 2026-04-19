import { useCallback, useMemo, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { DatabaseTypes } from 'repo-depkit-common';
import { UPDATE_PROFILE } from '@/redux/Types/types';
import { ProfileHelper } from '@/redux/actions/Profile/Profile';
import { UserHelper } from '@/helper/UserHelper';
import { useAppSelector } from '@/redux/hooks';

const MAX_LAST_OPENED = 4;

const useLastOpenedBuildings = () => {
	const dispatch = useDispatch();
	const profile = useAppSelector(state => state.authReducer.profile);
	const user = useAppSelector(state => state.authReducer.user);
	const profileHelper = useMemo(() => new ProfileHelper(), []);
	const isAnonymousUser = useMemo(() => UserHelper.isAnonymousUser(user), [user]);

	// Keep a ref to avoid stale closures when profileHelper is used in async callbacks
	const profileRef = useRef(profile);
	profileRef.current = profile;

	const buildingsLastOpenedIds: string[] = useMemo(() => {
		const entries = (profile?.buildings_last_opened ?? []) as (DatabaseTypes.ProfilesBuildingsLastOpened | string)[];
		return entries
			.map(entry => {
				if (typeof entry === 'string') return entry;
				const id = entry?.buildings_id;
				if (typeof id === 'string') return id;
				if (typeof id === 'object' && id !== null) return (id as any)?.id ? String((id as any).id) : undefined;
				return undefined;
			})
			.filter((id): id is string => Boolean(id));
	}, [profile?.buildings_last_opened]);

	const trackBuildingOpened = useCallback(
		async (buildingId: string) => {
			const currentProfile = profileRef.current;
			const current = (currentProfile?.buildings_last_opened ?? []) as (DatabaseTypes.ProfilesBuildingsLastOpened | string)[];

			// Remove duplicate, then prepend, then limit to MAX_LAST_OPENED
			const filtered = current.filter(entry => {
				const id = typeof entry === 'string' ? entry : (entry as DatabaseTypes.ProfilesBuildingsLastOpened)?.buildings_id;
				const resolvedId = typeof id === 'string' ? id : typeof id === 'object' && id !== null ? String((id as any)?.id ?? '') : '';
				return resolvedId !== buildingId;
			});

			const newEntry: Partial<DatabaseTypes.ProfilesBuildingsLastOpened> = {
				buildings_id: buildingId,
				...(currentProfile?.id ? { profiles_id: currentProfile.id } : {}),
			};

			const updated = [newEntry, ...filtered].slice(0, MAX_LAST_OPENED);
			const profileData = { ...currentProfile, buildings_last_opened: updated };

			dispatch({ type: UPDATE_PROFILE, payload: profileData });

			if (isAnonymousUser) return;

			try {
				await profileHelper.updateProfile(profileData);
			} catch (e) {
				console.error('Error updating buildings_last_opened:', e);
				// Revert Redux state to previous value on backend failure
				dispatch({ type: UPDATE_PROFILE, payload: currentProfile });
			}
		},
		[dispatch, profileHelper, isAnonymousUser]
	);

	return { buildingsLastOpenedIds, trackBuildingOpened };
};

export default useLastOpenedBuildings;
