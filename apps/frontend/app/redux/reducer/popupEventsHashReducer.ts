import { CLEAR_POPUP_EVENTS_HASH, SET_POPUP_EVENTS_HASH } from '@/redux/Types/types';

const initialState = {
	hashValue: '',
};

const popupEventsHashReducer = (state, actions: any) => {
	state = state === undefined ? initialState : state;

	switch (actions.type) {
		case SET_POPUP_EVENTS_HASH: {
			return {
				...state,
				hashValue: actions.payload,
			};
		}
		case CLEAR_POPUP_EVENTS_HASH: {
			return {
				...initialState,
			};
		}
		default:
			return state;
	}
};

export default popupEventsHashReducer;
