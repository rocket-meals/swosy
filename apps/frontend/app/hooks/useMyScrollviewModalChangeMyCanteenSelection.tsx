import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { CollectibleAt, DatabaseTypes } from 'repo-depkit-common';
import { SET_SELECTED_CANTEEN } from '@/redux/Types/types';
import CollectibleSpot from '@/components/CollectibleItem/CollectibleSpot';
import { useMyScrollviewModalCanteenSelection } from './useMyScrollviewModalCanteenSelection';

export const useMyScrollviewModalChangeMyCanteenSelection = () => {
	const { openCanteenSelectionModal, closeCanteenSelectionModal } = useMyScrollviewModalCanteenSelection();
	const dispatch = useDispatch();

	const openChangeMyCanteenSelectionModal = useCallback(() => {
		const handleSelectCanteen = (canteen: DatabaseTypes.Canteens) => {
			dispatch({ type: SET_SELECTED_CANTEEN, payload: canteen });
			closeCanteenSelectionModal();
		};

		openCanteenSelectionModal({
			onSelectCanteen: handleSelectCanteen,
			children: <CollectibleSpot collectibleKey={CollectibleAt.collectible_at_canteen_selection} />,
		});
	}, [closeCanteenSelectionModal, dispatch, openCanteenSelectionModal]);

	return { openChangeMyCanteenSelectionModal };
};

export default useMyScrollviewModalChangeMyCanteenSelection;
