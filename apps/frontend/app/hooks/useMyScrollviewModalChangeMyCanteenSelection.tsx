import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { CollectibleAt, DatabaseTypes } from 'repo-depkit-common';
import { SET_SELECTED_CANTEEN, UPDATE_PROFILE } from '@/redux/Types/types';
import CollectibleSpot from '@/components/CollectibleItem/CollectibleSpot';
import { useMyScrollviewModalCanteenSelection } from './useMyScrollviewModalCanteenSelection';
import { useAppSelector } from '@/redux/hooks';
import { UserHelper } from '@/helper/UserHelper';
import { ProfileHelper } from '@/redux/actions/Profile/Profile';

export const useMyScrollviewModalChangeMyCanteenSelection = () => {
	const { openCanteenSelectionModal, closeCanteenSelectionModal } = useMyScrollviewModalCanteenSelection();
	const dispatch = useDispatch();
	const { user, profile } = useAppSelector((state) => state.authReducer);

	const openChangeMyCanteenSelectionModal = useCallback(() => {
		const handleSelectCanteen = async (canteen: DatabaseTypes.Canteens) => {
			dispatch({ type: SET_SELECTED_CANTEEN, payload: canteen });
			closeCanteenSelectionModal();

			// Persist the selected canteen to the online profile for registered users
			if (UserHelper.isRegisteredUser(user) && profile?.id) {
				try {
					const profileHelper = new ProfileHelper();
					const updatedPayload = { ...profile, canteen: canteen.id };
					const result = (await profileHelper.updateProfile(updatedPayload)) as DatabaseTypes.Profiles;
					if (result) {
						dispatch({ type: UPDATE_PROFILE, payload: result });
					}
				} catch (error) {
					console.error('Error saving canteen to profile:', error);
				}
			}
		};

		openCanteenSelectionModal({
			onSelectCanteen: handleSelectCanteen,
			children: <CollectibleSpot collectibleKey={CollectibleAt.collectible_at_canteen_selection} />,
		});
	}, [closeCanteenSelectionModal, dispatch, openCanteenSelectionModal, user, profile]);

	return { openChangeMyCanteenSelectionModal };
};

export default useMyScrollviewModalChangeMyCanteenSelection;
