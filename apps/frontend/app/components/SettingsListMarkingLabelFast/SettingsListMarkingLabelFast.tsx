import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '@/redux/hooks';
import { SET_MARKING_DETAILS, UPDATE_PROFILE } from '@/redux/Types/types';
import PermissionModal from '../PermissionModal/PermissionModal';
import { getTextFromTranslation } from '@/helper/resourceHelper';
import { DatabaseTypes } from 'repo-depkit-common';
import MarkingIcon from '../MarkingIcon';
import { ProfileHelper } from '@/redux/actions/Profile/Profile';
import { UserHelper } from '@/helper/UserHelper';
import SettingsList from '@/components/SettingsList';
import { SettingsListProps } from '@/components/SettingsList/types';
import SettingsListLikeDislikeFast from '@/components/SettingsListLikeDislikeFast';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import { createSelector } from 'reselect';
import { RootState } from '@/redux/reducer';

export interface SettingsListMarkingLabelFastProps {
	markingId: string;
	handleMenuSheet?: () => void;
	size?: number;
	groupPosition?: SettingsListProps['groupPosition'];
}

const makeSelectMarking = (markingId: string) =>
	createSelector(
		[(state: RootState) => state.food.markings],
		markings => markings?.find((m: any) => m.id === markingId)
	);

const makeSelectOwnMarking = (markingId: string) =>
	createSelector(
		[(state: RootState) => state.authReducer.profile?.markings],
		profileMarkings => profileMarkings?.find((m: any) => m.markings_id === markingId)
	);

const SettingsListMarkingLabelFast: React.FC<SettingsListMarkingLabelFastProps> = ({
	markingId,
	handleMenuSheet,
	size = 30,
	groupPosition,
}) => {
	const dispatch = useDispatch();
	const { translate } = useLanguage();
	const [warning, setWarning] = useState(false);
	const language = useAppSelector(state => state.settings.language);
	const user = useAppSelector(state => state.authReducer.user);
	const profile = useAppSelector(state => state.authReducer.profile);

	const selectMarking = useMemo(() => makeSelectMarking(markingId), [markingId]);
	const selectOwnMarking = useMemo(() => makeSelectOwnMarking(markingId), [markingId]);
	const marking = useAppSelector(selectMarking);
	const ownMarking = useAppSelector(selectOwnMarking);

	const [likeLoading, setLikeLoading] = useState(false);
	const [dislikeLoading, setDislikeLoading] = useState(false);
	const profileHelper = useMemo(() => new ProfileHelper(), []);
	const isAnonymousUser = useMemo(() => UserHelper.isAnonymousUser(user), [user]);

	const openMarkingLabel = useCallback((markingItem: DatabaseTypes.Markings) => {
		if (handleMenuSheet) {
			dispatch({
				type: SET_MARKING_DETAILS,
				payload: markingItem,
			});
			handleMenuSheet();
		}
	}, [dispatch, handleMenuSheet]);

	const fetchProfile = useCallback(async () => {
		try {
			const fetchedProfile = (await profileHelper.fetchProfileById(user?.profile, {})) as DatabaseTypes.Profiles;
			if (fetchedProfile) {
				dispatch({ type: UPDATE_PROFILE, payload: fetchedProfile });
			}
		} catch (error) {
			console.error('Error fetching profiles:', error);
		}
	}, [profileHelper, user?.profile, dispatch]);

	const handleAnonymousMarking = useCallback((like: boolean) => {
		const profileData = { ...profile };
		let markingFound = false;

		profileData?.markings?.forEach((profileMarkings: any, index: number) => {
			if (profileMarkings?.markings_id === markingId) {
				const likeStats = profileMarkings?.like === like ? null : like;
				markingFound = true;
				if (likeStats === null) {
					profileData?.markings.splice(index, 1);
				} else {
					profileData.markings[index] = { ...ownMarking, like: like };
				}
			}
		});

		if (!markingFound) {
			profileData?.markings?.push({
				...ownMarking,
				like: like,
				markings_id: markingId,
				profiles_id: profileData?.id,
			});
		}

		dispatch({ type: UPDATE_PROFILE, payload: profileData });
	}, [profile, ownMarking, markingId, dispatch]);

	const handleUpdateMarking = useCallback(
		async (like: boolean) => {
			if (like) {
				setLikeLoading(true);
			} else {
				setDislikeLoading(true);
			}
			if (isAnonymousUser) {
				handleAnonymousMarking(like);
				if (like) {
					setLikeLoading(false);
				} else {
					setDislikeLoading(false);
				}
				return;
			} else {
				try {
					const likeStats = ownMarking?.like === like ? null : like;
					const updatedMarking = { ...ownMarking, like: likeStats };

					const profileData = { ...profile };
					let markingFound = false;

					profileData?.markings.forEach((profileMarkings: any, index: number) => {
						if (profileMarkings.markings_id === updatedMarking?.markings_id) {
							markingFound = true;
							if (updatedMarking?.like === null) {
								profileData.markings.splice(index, 1);
							} else {
								profileData.markings[index] = updatedMarking;
							}
						}
					});

					if (!markingFound) {
						profileData.markings.push({
							...updatedMarking,
							markings_id: markingId,
							profiles_id: profileData?.id,
						});
					}

					dispatch({ type: UPDATE_PROFILE, payload: profileData });

					const result = (await profileHelper.updateProfile(profileData)) as DatabaseTypes.Profiles;
					if (result) {
						fetchProfile();
						if (like) {
							setLikeLoading(false);
						} else {
							setDislikeLoading(false);
						}
					}
				} catch (error) {
					console.error('Error updating marking:', error);
				} finally {
					if (like) {
						setLikeLoading(false);
					} else {
						setDislikeLoading(false);
					}
				}
			}
		},
		[user?.id, profile, ownMarking, markingId, dispatch, profileHelper, fetchProfile, isAnonymousUser, handleAnonymousMarking]
	);

	const handlePressLike = useCallback(() => handleUpdateMarking(true), [handleUpdateMarking]);
	const handlePressDislike = useCallback(() => handleUpdateMarking(false), [handleUpdateMarking]);

	const markingText = useMemo(
		() => getTextFromTranslation(marking?.translations, language),
		[marking?.translations, language]
	);

	const leftIconComponent = useMemo(() => (
		<View style={styles.leftIconWrapper}>
			{handleMenuSheet && marking ? (
				<Pressable onPress={() => openMarkingLabel(marking)}>
					<MarkingIcon marking={marking} size={size} />
				</Pressable>
			) : marking ? (
				<MarkingIcon marking={marking} size={size} />
			) : null}
		</View>
	), [marking, size, handleMenuSheet, openMarkingLabel]);

	const rightElement = useMemo(() => (
		<View style={styles.rightRow}>
			<SettingsListLikeDislikeFast
				like={ownMarking?.like}
				onPressLike={handlePressLike}
				onPressDislike={handlePressDislike}
				likeLoading={likeLoading}
				dislikeLoading={dislikeLoading}
			/>
			<PermissionModal isVisible={warning} setIsVisible={setWarning} />
		</View>
	), [ownMarking?.like, handlePressLike, handlePressDislike, likeLoading, dislikeLoading, warning]);

	// Early return AFTER all hooks have been called
	if (!marking) return null;

	return (
		<SettingsList
			leftIconComponent={leftIconComponent}
			title={markingText || ''}
			rightElement={rightElement}
			groupPosition={groupPosition}
		/>
	);
};

export default React.memo(SettingsListMarkingLabelFast);

const styles = StyleSheet.create({
	leftIconWrapper: {
		marginRight: 10,
	},
	rightRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
});
