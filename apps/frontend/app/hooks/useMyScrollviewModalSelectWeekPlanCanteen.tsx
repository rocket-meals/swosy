import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { DatabaseTypes } from 'repo-depkit-common';
import { SET_WEEK_PLAN } from '@/redux/Types/types';
import { useMyScrollviewModalCanteenSelection } from './useMyScrollviewModalCanteenSelection';

export const useMyScrollviewModalSelectWeekPlanCanteen = () => {
	const { openCanteenSelectionModal, closeCanteenSelectionModal } = useMyScrollviewModalCanteenSelection();
	const dispatch = useDispatch();

	const openSelectWeekPlanCanteenModal = useCallback(() => {
		const handleSelectCanteen = (canteen: DatabaseTypes.Canteens) => {
			dispatch({ type: SET_WEEK_PLAN, payload: { selectedCanteen: canteen } });
			closeCanteenSelectionModal();
		};

		openCanteenSelectionModal({ onSelectCanteen: handleSelectCanteen });
	}, [closeCanteenSelectionModal, dispatch, openCanteenSelectionModal]);

	return { openSelectWeekPlanCanteenModal };
};

export default useMyScrollviewModalSelectWeekPlanCanteen;
