import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '@/redux/hooks';
import { SET_SELECTED_DATE } from '@/redux/Types/types';

const formatDate = (date: Date) => date.toISOString().split('T')[0];

let hasAppliedDefaultGlobally = false;

const useFoodOffersDefaultDate = () => {
	const dispatch = useDispatch();
	const { selectedDate } = useAppSelector((state) => state.food);

	const [currentTime, setCurrentTime] = useState(() => new Date());

	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentTime(new Date());
		}, 60_000);

		return () => clearInterval(interval);
	}, []);

	const todayString = useMemo(() => formatDate(currentTime), [currentTime]);
	const defaultDate = todayString;

	useEffect(() => {
		if (hasAppliedDefaultGlobally) {
			return;
		}

		if (selectedDate === defaultDate) {
			hasAppliedDefaultGlobally = true;
			return;
		}

		dispatch({ type: SET_SELECTED_DATE, payload: defaultDate });
		hasAppliedDefaultGlobally = true;
	}, [defaultDate, dispatch, selectedDate]);

	const applyDefaultDate = useCallback(() => {
		dispatch({ type: SET_SELECTED_DATE, payload: defaultDate });
	}, [defaultDate, dispatch]);

	return {
		defaultDate,
		isNextDay: false,
		threshold: null,
		applyDefaultDate,
	};
};

export default useFoodOffersDefaultDate;
