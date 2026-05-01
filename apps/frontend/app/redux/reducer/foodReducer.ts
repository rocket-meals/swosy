import { CLEAR_FOODS, DELETE_FOOD_FEEDBACK_LOCAL, DELETE_OWN_FOOD_FEEDBACK_LABEL_ENTRIES_LOCAL, SET_FOOD_CATEGORIES, SET_FOOD_COLLECTION, SET_FOOD_OFFERS_CATEGORIES, SET_FOODOFFERS_INFO_ITEMS, SET_MARKING_DETAILS, SET_MOST_DISLIKED_FOODS, SET_MOST_LIKED_FOODS, SET_POPUP_EVENTS, SET_SELECTED_DATE, SET_SELECTED_FOOD_MARKINGS, UPDATE_FOOD_FEEDBACK_LABELS, UPDATE_FOOD_FEEDBACK_LOCAL, UPDATE_MARKING_GROUPS, UPDATE_MARKINGS, UPDATE_OWN_FOOD_FEEDBACK, UPDATE_OWN_FOOD_FEEDBACK_LABEL_ENTRIES, UPDATE_OWN_FOOD_FEEDBACK_LABEL_ENTRIES_LOCAL } from '@/redux/Types/types';

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
	foodFeedbackLabelsDict: {},
	ownFoodFeedbacksDict: {},
	ownfoodFeedbackLabelEntriesDict: {},
	markingsDict: {},
	markingGroupsDict: {},
	selectedFoodMarkingsDict: {},
	foodCategoriesDict: {},
	foodOfferCategoriesDict: {},
	foodOffersInfoItemsDict: {},
	markingDetails: {},
	mostLikedFoodsDict: {},
	mostDislikedFoodsDict: {},
	foodCollection: {},
	popupEventsDict: {},
	selectedDate: new Date().toISOString().split('T')[0],
};

const foodReducer = (state = initialState, actions: any) => {
	switch (actions.type) {
		case SET_POPUP_EVENTS: {
			return {
				...state,
				popupEventsDict: arrayToDict(actions.payload, (item, index) => idKey(item) ?? `idx:${index}`),
			};
		}
		case SET_FOOD_COLLECTION: {
			return {
				...state,
				foodCollection: actions.payload,
			};
		}
		case UPDATE_FOOD_FEEDBACK_LABELS: {
			return {
				...state,
				foodFeedbackLabelsDict: arrayToDict(actions.payload, (item, index) => idKey(item) ?? `idx:${index}`),
			};
		}
		case SET_FOOD_CATEGORIES: {
			return {
				...state,
				foodCategoriesDict: arrayToDict(actions.payload, (item, index) => idKey(item) ?? `idx:${index}`),
			};
		}
		case SET_MARKING_DETAILS: {
			return {
				...state,
				markingDetails: actions.payload,
			};
		}
		case SET_FOOD_OFFERS_CATEGORIES: {
			return {
				...state,
				foodOfferCategoriesDict: arrayToDict(actions.payload, (item, index) => idKey(item) ?? `idx:${index}`),
			};
		}
		case SET_FOODOFFERS_INFO_ITEMS: {
			return {
				...state,
				foodOffersInfoItemsDict: arrayToDict(actions.payload, (item, index) => idKey(item) ?? `idx:${index}`),
			};
		}
		case UPDATE_OWN_FOOD_FEEDBACK: {
			return {
				...state,
				ownFoodFeedbacksDict: arrayToDict(actions.payload, (item, index) => (item?.food ? String(item.food) : idKey(item) ?? `idx:${index}`)),
			};
		}
		case UPDATE_FOOD_FEEDBACK_LOCAL: {
			const key = actions?.payload?.food ? String(actions.payload.food) : idKey(actions.payload);
			if (!key) return state;
			return {
				...state,
				ownFoodFeedbacksDict: {
					...(state.ownFoodFeedbacksDict || {}),
					[key]: actions.payload,
				},
			};
		}
		case DELETE_FOOD_FEEDBACK_LOCAL: {
			const nextDict = { ...(state.ownFoodFeedbacksDict || {}) } as Record<string, any>;
			const deleteId = actions.payload ? String(actions.payload) : null;
			if (deleteId) {
				for (const k of Object.keys(nextDict)) {
					const v = nextDict[k];
					if (String(v?.id ?? '') === deleteId || String(v?.food ?? '') === deleteId || k === deleteId) {
						delete nextDict[k];
					}
				}
			}
			return {
				...state,
				ownFoodFeedbacksDict: nextDict,
			};
		}
		case UPDATE_OWN_FOOD_FEEDBACK_LABEL_ENTRIES: {
			return {
				...state,
				ownfoodFeedbackLabelEntriesDict: arrayToDict(actions.payload, (item, index) => idKey(item) ?? (item?.label ? String(item.label) : `idx:${index}`)),
			};
		}
		case UPDATE_OWN_FOOD_FEEDBACK_LABEL_ENTRIES_LOCAL: {
			const key = actions?.payload?.label ? String(actions.payload.label) : idKey(actions.payload);
			if (!key) return state;
			return {
				...state,
				ownfoodFeedbackLabelEntriesDict: {
					...(state.ownfoodFeedbackLabelEntriesDict || {}),
					[key]: actions.payload,
				},
			};
		}
		case DELETE_OWN_FOOD_FEEDBACK_LABEL_ENTRIES_LOCAL: {
			const nextDict = { ...(state.ownfoodFeedbackLabelEntriesDict || {}) } as Record<string, any>;
			const deleteId = actions.payload ? String(actions.payload) : null;
			if (deleteId) {
				for (const k of Object.keys(nextDict)) {
					const v = nextDict[k];
					if (String(v?.id ?? '') === deleteId || k === deleteId) {
						delete nextDict[k];
					}
				}
			}
			return {
				...state,
				ownfoodFeedbackLabelEntriesDict: nextDict,
			};
		}
		case UPDATE_MARKINGS: {
			return {
				...state,
				markingsDict: arrayToDict(actions.payload, (item, index) => idKey(item) ?? `idx:${index}`),
			};
		}
		case UPDATE_MARKING_GROUPS: {
			return {
				...state,
				markingGroupsDict: arrayToDict(actions.payload, (item, index) => idKey(item) ?? `idx:${index}`),
			};
		}
		case SET_SELECTED_FOOD_MARKINGS: {
			return {
				...state,
				selectedFoodMarkingsDict: arrayToDict(actions.payload, (item, index) => idKey(item) ?? (item?.markings_id ? String(item.markings_id) : `idx:${index}`)),
			};
		}
		case SET_MOST_LIKED_FOODS: {
			return {
				...state,
				mostLikedFoodsDict: arrayToDict(actions.payload, (item, index) => idKey(item) ?? `idx:${index}`),
			};
		}
		case SET_MOST_DISLIKED_FOODS: {
			return {
				...state,
				mostDislikedFoodsDict: arrayToDict(actions.payload, (item, index) => idKey(item) ?? `idx:${index}`),
			};
		}
		case SET_SELECTED_DATE: {
			return {
				...state,
				selectedDate: actions.payload,
			};
		}
		case CLEAR_FOODS: {
			return {
				...initialState,
			};
		}
		default:
			return state;
	}
};

export default foodReducer;
