import { CLEAR_APP_ELEMENTS, SET_APP_ELEMENTS } from '@/redux/Types/types';
import { DatabaseTypes } from 'repo-depkit-common';

const arrayToDict = <T>(payload: unknown, getKey: (item: any, index: number) => string | null): Record<string, T> => {
	if (!payload) return {};
	if (!Array.isArray(payload)) return payload as Record<string, T>;
	return payload.reduce((acc: Record<string, T>, item: any, index: number) => {
		const key = getKey(item, index);
		if (key) {
			acc[key] = item;
		}
		return acc;
	}, {});
};

const idKey = (item: any) => (item?.id ? String(item.id) : null);

const initialState = {
	appElementsDict: {} as Record<string, DatabaseTypes.AppElements>,
};

const appElementsReducer = (state = initialState, actions: any) => {
	switch (actions.type) {
		case SET_APP_ELEMENTS: {
			return {
				...state,
				appElementsDict: arrayToDict(actions.payload, (item, index) => idKey(item) ?? `idx:${index}`),
			};
		}
		case CLEAR_APP_ELEMENTS: {
			return {
				...initialState,
			};
		}
		default:
			return state;
	}
};

export default appElementsReducer;
