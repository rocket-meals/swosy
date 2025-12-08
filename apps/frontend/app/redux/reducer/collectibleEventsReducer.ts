import { CLEAR_COLLECTIBLE_EVENTS, SET_COLLECTIBLE_EVENT_DICT, SET_COLLECTIBLE_EVENTS } from '../Types/types';

const initialState = {
        collectibleEvents: [],
        collectibleEventsDict: {},
};

const collectibleEventsReducer = (state = initialState, actions: any) => {
        switch (actions.type) {
                case SET_COLLECTIBLE_EVENTS: {
                        return {
                                ...state,
                                collectibleEvents: actions.payload,
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
