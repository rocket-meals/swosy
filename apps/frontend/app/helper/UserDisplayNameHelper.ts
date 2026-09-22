/**
 * Minimal shape of the `directus_users` fields the app loads for display purposes.
 */
export type UserDisplayNameSource = {
	first_name?: string | null;
	last_name?: string | null;
	email?: string | null;
};

const trimOrEmpty = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

/**
 * Build a human readable name for a Directus user relation.
 *
 * Returns `"<first_name> <last_name>"` when at least one of the two is set,
 * otherwise the email. An SSO hook may blank `first_name`/`last_name` for some
 * users, so the email fallback is a normal case, not an edge case.
 *
 * Returns an empty string when nothing usable is available — in particular when
 * the relation was not expanded and only the user id string is present (offline
 * / cached data). Callers use that to hide the block entirely.
 */
export function getUserDisplayName(user: UserDisplayNameSource | string | null | undefined): string {
	if (!user || typeof user !== 'object') {
		return '';
	}

	const fullName = [trimOrEmpty(user.first_name), trimOrEmpty(user.last_name)].filter(Boolean).join(' ');
	if (fullName) {
		return fullName;
	}

	return trimOrEmpty(user.email);
}
