import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { DatabaseTypes } from 'repo-depkit-common';
import { SET_FOOD_PLAN } from '@/redux/Types/types';
import { useMyScrollviewModalCanteenSelection } from './useMyScrollviewModalCanteenSelection';

export const useMyScrollviewModalSelectFoodPlanCanteen = () => {
	const { openCanteenSelectionModal, closeCanteenSelectionModal } = useMyScrollviewModalCanteenSelection();
	const dispatch = useDispatch();

	const openSelectFoodPlanCanteenModal = useCallback(
		(option: 'canteen' | 'additional') => {
			const handleSelectCanteen = (canteen: DatabaseTypes.Canteens) => {
				if (option === 'canteen') {
					dispatch({ type: SET_FOOD_PLAN, payload: { selectedCanteen: canteen } });
				} else {
					dispatch({ type: SET_FOOD_PLAN, payload: { additionalSelectedCanteen: canteen } });
				}
				closeCanteenSelectionModal();
			};

			openCanteenSelectionModal({ onSelectCanteen: handleSelectCanteen });
		},
		[closeCanteenSelectionModal, dispatch, openCanteenSelectionModal]
	);

	return { openSelectFoodPlanCanteenModal };
};

export default useMyScrollviewModalSelectFoodPlanCanteen;
