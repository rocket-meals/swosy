import { DatabaseTypes, StringHelper } from 'repo-depkit-common';
import { CollectionHelper } from '@/helper/collectionHelper';

// A search term counts as numeric only when it is a plain integer or decimal
// (optionally signed, with '.' or ',' as decimal separator) — '12abc' must not
// be turned into a value_number match.
const PLAIN_NUMBER_PATTERN = /^[+-]?\d+([.,]\d+)?$/;

/**
 * Parse a search term as a plain number, or return null when the term is not a
 * plain integer/decimal.
 */
function parsePlainNumber(term: string): number | null {
	if (!PLAIN_NUMBER_PATTERN.test(term)) {
		return null;
	}
	const normalized = StringHelper.replaceAllLiteralWithOptions({ str: term, find: ',', replace: '.' });
	const parsed = Number.parseFloat(normalized);

	return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Build the Directus `_or` conditions for a free-text search over a form
 * submission: its alias and the text (and, for numeric terms, numeric) answers
 * of the submission.
 */
function buildSearchOrConditions(term: string): any[] {
	const conditions: any[] = [{ alias: { _icontains: term } }, { form_answers: { value_string: { _icontains: term } } }];

	const numericTerm = parsePlainNumber(term);
	if (numericTerm !== null) {
		conditions.push({ form_answers: { value_number: { _eq: numericTerm } } });
	}

	return conditions;
}

export class FormsSubmissionsHelper extends CollectionHelper<DatabaseTypes.FormSubmissions> {
	constructor(client?: any) {
		super('form_submissions', client);
	}

	async fetchFormSubmissions(queryOverride: any = {}) {
		// Destructure parameters from queryOverride and provide defaults.
		const { alias, state, page = 1, offset = 0, limit = -1, sort, form, ...restQuery } = queryOverride;

		// Build filters object based on alias and state if provided.
		const filters: any = {};
		if (form) {
			filters.form = { _eq: form };
		}
		if (state) {
			// Assuming exact match is needed for state.
			filters.state = { _eq: state };
		}
		const searchTerm = typeof alias === 'string' ? alias.trim() : '';
		if (searchTerm) {
			// Directus ANDs sibling keys, so `form`/`state` above stay required
			// while the search itself may match the alias or any answer.
			filters._or = buildSearchOrConditions(searchTerm);
		}

		const defaultQuery = {
			// Only fetch the fields needed for the list view; full data is loaded on demand.
			fields: ['id', 'alias'],
			// Sort by date_updated (or custom sort if provided).
			sort: sort || ['date_updated'],
			// Apply the filters built above.
			filter: filters,
			// Set pagination defaults.
			page,
			offset,
			limit,
			...restQuery,
		};

		return await this.readItems(defaultQuery);
	}

	async fetchFormubmissionById(id: string, queryOverride: any = {}) {
		const defaultQuery = {
			fields: [' * , translations.*'],
		};

		const query = { ...defaultQuery, ...queryOverride };
		return await this.readItem(id, query);
	}

	async updateFormSubmissionById(id: string, updatedData: any) {
		return await this.updateItem(id, updatedData);
	}
}
