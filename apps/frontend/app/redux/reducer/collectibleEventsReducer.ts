import {
        CLEAR_COLLECTIBLE_EVENTS,
        RESET_ALL_COLLECTIBLE_EVENT_DICTS,
        RESET_COLLECTIBLE_EVENT_DICT,
        SET_COLLECTIBLE_EVENT_DICT,
        SET_COLLECTIBLE_EVENT_DICT_BULK,
        SET_COLLECTIBLE_EVENTS,
} from '../Types/types';
import { CollectibleEventsState } from '../Types/stateTypes';
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

const initialState: CollectibleEventsState = {
        collectibleEventsItemsDict: {} as Record<string, DatabaseTypes.CollectibleEvents>,
        collectibleEventsDict: {} as Record<string, Record<string, boolean>>,
};

const collectibleEventsReducer = (state: CollectibleEventsState = initialState, actions: { type: string; payload?: any }) => {
        switch (actions.type) {
                case SET_COLLECTIBLE_EVENTS: {
                        return {
                                ...state,
                                collectibleEventsItemsDict: arrayToDict(actions.payload, (item, index) => idKey(item) ?? `idx:${index}`),
                        };
                }
                case SET_COLLECTIBLE_EVENT_DICT: {
                        const { eventId, key, value } = actions.payload || {};

                        if (!eventId || !key) {
                                return state;
                        }

                        return {
                                ...state,
                                collectibleEventsDict: {
                                        ...state.collectibleEventsDict,
                                        [eventId]: {
                                                ...(state.collectibleEventsDict?.[eventId] || {}),
                                                [key]: value,
                                        },
                                },
                        };
                }
                case SET_COLLECTIBLE_EVENT_DICT_BULK: {
                        const { eventId, data } = actions.payload || {};

                        if (!eventId) {
                                return state;
                        }

                        return {
                                ...state,
                                collectibleEventsDict: {
                                        ...state.collectibleEventsDict,
                                        [eventId]: data || {},
                                },
                        };
                }
                case RESET_COLLECTIBLE_EVENT_DICT: {
                        const { eventId } = actions.payload || {};

                        if (!eventId) {
                                return state;
                        }

                        const updatedDict = { ...state.collectibleEventsDict };
                        delete updatedDict[eventId];

                        return {
                                ...state,
                                collectibleEventsDict: updatedDict,
                        };
                }
                case RESET_ALL_COLLECTIBLE_EVENT_DICTS: {
                        return {
                                ...state,
                                collectibleEventsDict: {},
                        };
                }
                case CLEAR_COLLECTIBLE_EVENTS: {
                        return {
                                ...initialState,
                        };
                }
                default:
                        return state;
        }
};

export default collectibleEventsReducer;
