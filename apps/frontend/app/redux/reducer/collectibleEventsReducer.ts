import { CLEAR_COLLECTIBLE_EVENTS, SET_COLLECTIBLE_EVENTS } from '../Types/types';

const initialState = {
        collectibleEvents: [],
};

const collectibleEventsReducer = (state = initialState, actions: any) => {
        switch (actions.type) {
                case SET_COLLECTIBLE_EVENTS: {
                        return {
                                ...state,
                                collectibleEvents: actions.payload,
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
