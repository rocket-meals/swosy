import React, { useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { CollectibleAt, DatabaseTypes } from 'repo-depkit-common';
import { SET_SELECTED_CANTEEN, UPDATE_PROFILE } from '@/redux/Types/types';
import CollectibleSpot from '@/components/CollectibleItem/CollectibleSpot';
import { useMyScrollviewModalCanteenSelection } from './useMyScrollviewModalCanteenSelection';
import { useAppSelector } from '@/redux/hooks';
import { ProfileHelper } from '@/redux/actions/Profile/Profile';

export const useMyScrollviewModalChangeMyCanteenSelection = () => {
	const { openCanteenSelectionModal, closeCanteenSelectionModal } = useMyScrollviewModalCanteenSelection();
	const dispatch = useDispatch();
	const { profile, user } = useAppSelector((state) => state.authReducer);
	const profileHelper = useMemo(() => new ProfileHelper(), []);

	const openChangeMyCanteenSelectionModal = useCallback(() => {
		const handleSelectCanteen = (canteen: DatabaseTypes.Canteens) => {
			dispatch({ type: SET_SELECTED_CANTEEN, payload: canteen });
			if (user?.id && profile?.id) {
				profileHelper.updateProfile({ id: profile.id, canteen: canteen.id })
					.then((updatedProfile) => {
						if (updatedProfile) {
							dispatch({ type: UPDATE_PROFILE, payload: updatedProfile });
						}
					})
					.catch((err) => console.error('Failed to save canteen to profile:', err));
			}
			closeCanteenSelectionModal();
		};

		openCanteenSelectionModal({
			onSelectCanteen: handleSelectCanteen,
			children: <CollectibleSpot collectibleKey={CollectibleAt.collectible_at_canteen_selection} />,
		});
	}, [closeCanteenSelectionModal, dispatch, openCanteenSelectionModal, profile, profileHelper, user]);

	return { openChangeMyCanteenSelectionModal };
};

export default useMyScrollviewModalChangeMyCanteenSelection;
