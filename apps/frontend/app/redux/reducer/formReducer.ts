import { ADD_FORM_QUEUE_ENTRY, CLEAR_FORM, CLEAR_FORM_QUEUE, REMOVE_FORM_QUEUE_ENTRY, SET_FORM_FILTER, SET_FORM_SUBMISSION, UPDATE_FORM_QUEUE_ENTRY } from '@/redux/Types/types';
import { FormQueueEntry } from '@/redux/Types/stateTypes';

const initialState = {
	filterBy: 'draft',
	formSubmission: {},
	formQueue: [] as FormQueueEntry[],
};

const formReducer = (state = initialState, actions: any) => {
	switch (actions.type) {
		case SET_FORM_FILTER: {
			return {
				...state,
				filterBy: actions.payload,
			};
		}
		case SET_FORM_SUBMISSION: {
			return {
				...state,
				formSubmission: actions.payload,
			};
		}
		case ADD_FORM_QUEUE_ENTRY: {
			const existingIndex = state.formQueue.findIndex((entry: FormQueueEntry) => entry.form_submission_id === actions.payload.form_submission_id);
			if (existingIndex !== -1) {
				const updated = [...state.formQueue];
				updated[existingIndex] = actions.payload;
				return { ...state, formQueue: updated };
			}
			return { ...state, formQueue: [...state.formQueue, actions.payload] };
		}
		case REMOVE_FORM_QUEUE_ENTRY: {
			return {
				...state,
				formQueue: state.formQueue.filter((entry: FormQueueEntry) => entry.id !== actions.payload),
			};
		}
		case UPDATE_FORM_QUEUE_ENTRY: {
			return {
				...state,
				formQueue: state.formQueue.map((entry: FormQueueEntry) =>
					entry.id === actions.payload.id ? { ...entry, ...actions.payload } : entry
				),
			};
		}
		case CLEAR_FORM_QUEUE: {
			return { ...state, formQueue: [] };
		}
		case CLEAR_FORM: {
			return {
				...initialState,
			};
		}
		default:
			return state;
	}
};

export default formReducer;
