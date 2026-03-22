import { CLEAR_CANTEENS, DELETE_OWN_CANTEEN_FEEDBACK_LABEL_ENTRIES, SET_BUILDINGS, SET_BUILDINGS_DICT, SET_BUILDINGS_ORGANIZATIONS, SET_BUSINESS_HOURS, SET_BUSINESS_HOURS_GROUPS, SET_CANTEEN_FEEDBACK_LABELS, SET_CANTEENS, SET_OWN_CANTEEN_FEEDBACK_LABEL_ENTRIES, SET_ORGANISATIONS, SET_SELECTED_CANTEEN, SET_SELECTED_CANTEEN_FOOD_OFFERS, SET_SELECTED_CANTEEN_FOOD_OFFERS_LOCAL, UPDATE_OWN_CANTEEN_FEEDBACK_LABEL_ENTRIES } from '@/redux/Types/types';

const arrayToDictById = <T extends { id?: any }>(payload: unknown): Record<string, T> => {
	if (!payload) return {};
	if (!Array.isArray(payload)) return payload as Record<string, T>;
	return payload.reduce((acc: Record<string, T>, item: any) => {
		if (item?.id) {
			acc[String(item.id)] = item;
		}
		return acc;
	}, {});
};

const getCanteenFeedbackLabelEntryKey = (entry: any): string | null => {
	if (entry?.id) return String(entry.id);
	if (entry?.label && entry?.canteen && entry?.date) return `${String(entry.label)}|${String(entry.canteen)}|${String(entry.date)}`;
	return null;
};

const initialState = {
	canteensDict: {},
	buildingsDict: {},
	buildingsOrganizationsDict: {},
	organisationsDict: {},
	selectedCanteen: null,
	selectedCanteenFoodOffersDict: {},
	canteenFoodOffersDict: {},
	businessHoursDict: {},
	businessHoursGroupsDict: {},
	canteenFeedbackLabelsDict: {},
	ownCanteenFeedBackLabelEntriesDict: {},
};

const canteensReducer = (state = initialState, actions: any) => {
	switch (actions.type) {
		case SET_CANTEENS: {
			return {
				...state,
				canteensDict: arrayToDictById(actions.payload),
			};
		}
		case SET_BUILDINGS: {
			const payload = actions.payload;
			const buildingsDict = Array.isArray(payload)
				? payload.reduce((acc: Record<string, any>, building: any) => {
						if (building?.id) {
							acc[String(building.id)] = building;
						}
						return acc;
				  }, {})
				: (payload ?? {});
			return {
				...state,
				buildingsDict,
			};
		}
		case SET_BUILDINGS_DICT: {
			return {
				...state,
				buildingsDict: actions.payload ?? {},
			};
		}
		case SET_BUILDINGS_ORGANIZATIONS: {
			return {
				...state,
				buildingsOrganizationsDict: arrayToDictById(actions.payload),
			};
		}
		case SET_ORGANISATIONS: {
			return {
				...state,
				organisationsDict: arrayToDictById(actions.payload),
			};
		}
		case SET_SELECTED_CANTEEN: {
			return {
				...state,
				selectedCanteen: actions.payload,
			};
		}
		case SET_SELECTED_CANTEEN_FOOD_OFFERS: {
			return {
				...state,
				selectedCanteenFoodOffersDict: arrayToDictById(actions.payload),
			};
		}
		case SET_SELECTED_CANTEEN_FOOD_OFFERS_LOCAL: {
			return {
				...state,
				canteenFoodOffersDict: arrayToDictById(actions.payload),
			};
		}
		case SET_BUSINESS_HOURS: {
			return {
				...state,
				businessHoursDict: arrayToDictById(actions.payload),
			};
		}
		case SET_BUSINESS_HOURS_GROUPS: {
			return {
				...state,
				businessHoursGroupsDict: arrayToDictById(actions.payload),
			};
		}
		case SET_CANTEEN_FEEDBACK_LABELS: {
			return {
				...state,
				canteenFeedbackLabelsDict: arrayToDictById(actions.payload),
			};
		}
		case SET_OWN_CANTEEN_FEEDBACK_LABEL_ENTRIES: {
			return {
				...state,
				ownCanteenFeedBackLabelEntriesDict: arrayToDictById(actions.payload),
			};
		}
		case UPDATE_OWN_CANTEEN_FEEDBACK_LABEL_ENTRIES: {
			const key = getCanteenFeedbackLabelEntryKey(actions.payload);
			if (!key) return state;
			return {
				...state,
				ownCanteenFeedBackLabelEntriesDict: {
					...(state.ownCanteenFeedBackLabelEntriesDict || {}),
					[key]: actions.payload,
				},
			};
		}
		case DELETE_OWN_CANTEEN_FEEDBACK_LABEL_ENTRIES: {
			const nextDict = { ...(state.ownCanteenFeedBackLabelEntriesDict || {}) } as Record<string, any>;
			if (actions.payload && String(actions.payload) in nextDict) {
				delete nextDict[String(actions.payload)];
			}
			return {
				...state,
				ownCanteenFeedBackLabelEntriesDict: nextDict,
			};
		}
		case CLEAR_CANTEENS: {
			return {
				...initialState,
			};
		}
		default:
			return state;
	}
};

export default canteensReducer;
