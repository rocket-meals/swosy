import { CLEAR_FOOD_ATTRIBUTES, SET_FOOD_ATTRIBUTE_GROUPS, SET_FOOD_ATTRIBUTES_DICT } from '@/redux/Types/types';

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
	foodAttributeGroupsDict: {},
	foodAttributesDict: {},
};

const foodAttributesReducer = (state = initialState, actions: any) => {
	switch (actions.type) {
		case SET_FOOD_ATTRIBUTE_GROUPS: {
			return {
				...state,
				foodAttributeGroupsDict: arrayToDict(actions.payload, (item, index) => idKey(item) ?? `idx:${index}`),
			};
		}

		case SET_FOOD_ATTRIBUTES_DICT: {
			return {
				...state,
				foodAttributesDict: actions.payload,
			};
		}
		case CLEAR_FOOD_ATTRIBUTES: {
			return {
				...initialState,
			};
		}
		default:
			return state;
	}
};

export default foodAttributesReducer;
