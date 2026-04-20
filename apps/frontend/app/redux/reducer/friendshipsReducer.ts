import { ADD_FRIENDSHIP, CLEAR_FRIENDSHIPS, SET_FRIENDSHIPS, UPDATE_FRIENDSHIP } from '../Types/types';
import { FriendshipsState } from '../Types/stateTypes';
import { DatabaseTypes } from 'repo-depkit-common';

const initialState: FriendshipsState = {
	friendships: [] as DatabaseTypes.Friendships[],
};

const friendshipsReducer = (state: FriendshipsState = initialState, action: { type: string; payload?: any }) => {
	switch (action.type) {
		case SET_FRIENDSHIPS:
			return {
				...state,
				friendships: action.payload,
			};
		case ADD_FRIENDSHIP:
			return {
				...state,
				friendships: [...state.friendships, action.payload],
			};
		case UPDATE_FRIENDSHIP: {
			const updated = action.payload as DatabaseTypes.Friendships;
			return {
				...state,
				friendships: state.friendships.map((f) => (f.id === updated.id ? updated : f)),
			};
		}
		case CLEAR_FRIENDSHIPS:
			return {
				...initialState,
			};
		default:
			return state;
	}
};

export default friendshipsReducer;
