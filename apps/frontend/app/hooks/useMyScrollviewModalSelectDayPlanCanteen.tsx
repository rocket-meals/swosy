import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { DatabaseTypes } from 'repo-depkit-common';
import { SET_DAY_PLAN } from '@/redux/Types/types';
import { useMyScrollviewModalCanteenSelection } from './useMyScrollviewModalCanteenSelection';

export const useMyScrollviewModalSelectDayPlanCanteen = () => {
	const { openCanteenSelectionModal, closeCanteenSelectionModal } = useMyScrollviewModalCanteenSelection();
	const dispatch = useDispatch();

	const openSelectDayPlanCanteenModal = useCallback(() => {
		const handleSelectCanteen = (canteen: DatabaseTypes.Canteens) => {
			dispatch({ type: SET_DAY_PLAN, payload: { selectedCanteen: canteen } });
			closeCanteenSelectionModal();
		};

		openCanteenSelectionModal({ onSelectCanteen: handleSelectCanteen });
	}, [closeCanteenSelectionModal, dispatch, openCanteenSelectionModal]);

	return { openSelectDayPlanCanteenModal };
};

export default useMyScrollviewModalSelectDayPlanCanteen;
