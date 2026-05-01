import { ADD_FORM_QUEUE_ENTRY, CLEAR_CACHED_FORM_DATA, CLEAR_FORM, CLEAR_FORM_QUEUE, REMOVE_FORM_QUEUE_ENTRY, SET_CACHED_FORM_DATA, SET_CACHED_FORM_CATEGORIES, SET_CACHED_FORMS, SET_FORM_FILTER, SET_FORM_SUBMISSION, UPDATE_FORM_QUEUE_ENTRY } from '@/redux/Types/types';
import { CachedFormEntry, FormQueueEntry } from '@/redux/Types/stateTypes';
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

const byFormSubmissionIdKey = (item: any) => (item?.form_submission_id ? String(item.form_submission_id) : idKey(item));

const initialState = {
	filterBy: 'draft',
	formSubmission: {},
	formQueueDict: {} as Record<string, FormQueueEntry>,
	cachedFormData: {} as Record<string, CachedFormEntry>,
	cachedFormCategoriesDict: {} as Record<string, DatabaseTypes.FormCategories>,
	cachedFormsDict: {} as Record<string, Record<string, DatabaseTypes.Forms>>,
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
			const key = byFormSubmissionIdKey(actions.payload);
			if (!key) {
				return state;
			}
			return {
				...state,
				formQueueDict: {
					...(state.formQueueDict || {}),
					[key]: actions.payload,
				},
			};
		}
		case REMOVE_FORM_QUEUE_ENTRY: {
			const idToRemove = String(actions.payload ?? '');
			const updated = { ...(state.formQueueDict || {}) };
			Object.keys(updated).forEach((key) => {
				const entry = updated[key];
				if (String(entry?.id) === idToRemove || String(entry?.form_submission_id) === idToRemove) {
					delete updated[key];
				}
			});
			return {
				...state,
				formQueueDict: updated,
			};
		}
		case UPDATE_FORM_QUEUE_ENTRY: {
			const payload = actions.payload;
			const idToUpdate = String(payload?.id ?? '');
			const updated = { ...(state.formQueueDict || {}) };
			let updatedKey: string | null = null;

			Object.keys(updated).forEach((key) => {
				const entry = updated[key];
				if (String(entry?.id) === idToUpdate) {
					updated[key] = { ...entry, ...payload };
					updatedKey = key;
				}
			});

			if (!updatedKey) {
				const key = byFormSubmissionIdKey(payload);
				if (key) {
					updated[key] = payload;
				}
			}

			return { ...state, formQueueDict: updated };
		}
		case CLEAR_FORM_QUEUE: {
			return { ...state, formQueueDict: {} };
		}
		case SET_CACHED_FORM_DATA: {
			const { form_id, form, submissions, answers } = actions.payload;
			return {
				...state,
				cachedFormData: {
					...(state.cachedFormData || {}),
					[form_id]: { form, submissions, answers },
				},
			};
		}
		case CLEAR_CACHED_FORM_DATA: {
			return { ...state, cachedFormData: {} };
		}
		case SET_CACHED_FORM_CATEGORIES: {
			return {
				...state,
				cachedFormCategoriesDict: arrayToDict(actions.payload, (item, index) => idKey(item) ?? `idx:${index}`),
			};
		}
		case SET_CACHED_FORMS: {
			const { category_id, forms } = actions.payload;
			const formsDict = arrayToDict(forms, (item, index) => idKey(item) ?? `idx:${index}`);
			return {
				...state,
				cachedFormsDict: {
					...(state.cachedFormsDict || {}),
					[String(category_id)]: formsDict,
				},
			};
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
