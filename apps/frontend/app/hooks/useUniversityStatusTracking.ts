import { useEffect } from 'react';
import { customEndpoint } from '@directus/sdk';
import { useAppSelector } from '@/redux/hooks';
import { ServerAPI } from '@/redux/actions/Auth/Auth';
import { trackUniversityStatusChecked } from '@/helper/AppUsageEventHelper';

/** Only a login via university (DFN) reports a status. */
const UNIVERSITY_PROVIDER = 'dfn';

/** The status the university reported at the last login, read with the token of the user. */
async function fetchUniversityAffiliation(): Promise<Record<string, unknown>> {
	const client = ServerAPI.getClient() as any;
	return client.request(customEndpoint<Record<string, unknown>>({ path: '/university-affiliation', method: 'GET' }));
}

/** Users already reported in this app start: once per start (and after every new login). */
const reportedUserIds = new Set<string>();

/**
 * Once per app start, and after a login: when the user logged in via "Uni/Hochschule", the app reads
 * `GET /university-affiliation` and sends it as usage event `university_status_checked`, whatever
 * status the university reported. Shows in the backend whether the status check works.
 *
 * Fire and forget: a failed request is logged and tried again on the next start.
 */
export function useUniversityStatusTracking() {
	const { loggedIn, user } = useAppSelector(state => state.authReducer);
	const userId: string | undefined = user?.id ?? undefined;
	const isUniversityLogin = Boolean(loggedIn && userId && user?.provider === UNIVERSITY_PROVIDER);

	useEffect(() => {
		if (!isUniversityLogin || !userId || reportedUserIds.has(userId)) {
			return;
		}
		reportedUserIds.add(userId);
		void (async () => {
			try {
				await trackUniversityStatusChecked(await fetchUniversityAffiliation());
			} catch (error) {
				console.log('useUniversityStatusTracking: could not report the university status', error);
			}
		})();
	}, [isUniversityLogin, userId]);

	useEffect(() => {
		// A logout ends the session: the next login of the same user is reported again.
		if (!loggedIn) {
			reportedUserIds.clear();
		}
	}, [loggedIn]);
}
