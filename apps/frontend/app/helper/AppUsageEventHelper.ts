import { Platform } from 'react-native';
import { AppUsageEventName, AppUsageEventNames, AppUsageEventTypes, isAppUsageEventEnabled, UuidHelper } from 'repo-depkit-common';

import { getVersion, getVersionInternalForAppsettingsScreen } from '@/config';
import { AppUsageEvents } from '@/redux/actions/AppUsageEvents/AppUsageEvents';
import { configureStore } from '@/redux/store';

/**
 * Reporting of anonymous app usage events to the `app_usage_events` collection.
 *
 * Events carry no user reference: they are grouped by a session id that is
 * created once per app start and only lives in memory.
 *
 * Which events are sent is decided by `app_settings.app_usage_events_enabled`
 * (see `isAppUsageEventEnabled` in `repo-depkit-common`).
 */

export const APP_USAGE_EVENT_TYPE_APP_RATING = AppUsageEventTypes.APP_RATING;

/**
 * Sent directly before the native store review dialog is requested.
 *
 * Counting these events against the reviews that actually arrive in the stores
 * shows how often the dialog is dismissed without a rating. The event is only
 * sent when the dialog is really requested - never when the prompt is skipped
 * because the score threshold was not reached, because the user was already
 * asked for this app version or because the platform offers no native dialog.
 */
export const APP_USAGE_EVENT_NAME_NATIVE_REVIEW_PROMPT_REQUESTED = AppUsageEventNames.NATIVE_REVIEW_PROMPT_REQUESTED;

/**
 * Where a native review prompt was triggered from. Sources prefixed with
 * `debug_` are only reachable in debug mode and can be filtered out when
 * evaluating the collected events.
 */
export const AppRatingPromptSources = {
	SCORE_THRESHOLD: 'app_rating_score_threshold',
	RATE_APP_ITEM: 'rate_app_item',
	COLLECTIBLE_EVENT_CONGRATULATIONS: 'collectible_event_congratulations',
	POPUP_EVENT_SHEET: 'popup_event_sheet',
	FOOD_ITEM: 'food_item',
	GIVE_FEEDBACK_SCREEN: 'give_feedback_screen',
	DEBUG_RATING_MODAL: 'debug_rating_modal',
	DEBUG_CHECK_APP_RATE_ASKING: 'debug_check_app_rate_asking',
	DEBUG_EXPERIMENTAL_RATE_APP_SCREEN: 'debug_experimental_rate_app_screen',
} as const;

export type AppRatingPromptSource = (typeof AppRatingPromptSources)[keyof typeof AppRatingPromptSources];

export type AppUsageEventInput = {
	event_type: string;
	event_name: string;
	screen_name?: string | null;
	payload?: Record<string, unknown> | null;
	payload_boolean?: boolean | null;
	payload_number?: number | null;
	payload_datetime?: string | null;
};

let sessionId: string | null = null;
let sequenceNumber = 0;
let collectionHelper: AppUsageEvents | null = null;

const padTwoDigits = (value: number) => String(value).padStart(2, '0');

/**
 * `client_timestamp` is a Directus dateTime ("timestamp without time zone"), so
 * the local wall clock time is sent without a timezone suffix. The offset to UTC
 * travels in the payload, the exact moment stays in the server side
 * `date_created`.
 */
const getLocalTimestamp = (date: Date) =>
	`${date.getFullYear()}-${padTwoDigits(date.getMonth() + 1)}-${padTwoDigits(date.getDate())}` +
	`T${padTwoDigits(date.getHours())}:${padTwoDigits(date.getMinutes())}:${padTwoDigits(date.getSeconds())}`;

/**
 * Random id shared by all events of the current app start. It only groups the
 * events of one session and is never used for anything security relevant.
 */
export const getAppUsageSessionId = () => {
	if (!sessionId) {
		sessionId = UuidHelper.randomUUID();
	}
	return sessionId;
};

const getEnabledEventsSetting = (): unknown => {
	try {
		return configureStore.getState().settings.appSettings?.app_usage_events_enabled;
	} catch {
		return null;
	}
};

/** Whether `app_settings` allows sending the event. */
export const isAppUsageEventNameEnabled = (eventName: string) => isAppUsageEventEnabled(getEnabledEventsSetting(), eventName);

const getCollectionHelper = () => {
	collectionHelper ??= new AppUsageEvents();
	return collectionHelper;
};

/**
 * Reports a single usage event. Never throws and never rejects: usage reporting
 * must not influence the flow it is measuring, so callers can fire and forget.
 *
 * Events switched off in `app_settings.app_usage_events_enabled` are dropped
 * without a request.
 *
 * @returns whether the event reached the server
 */
export const trackAppUsageEvent = async (event: AppUsageEventInput): Promise<boolean> => {
	if (!isAppUsageEventNameEnabled(event.event_name)) {
		return false;
	}
	sequenceNumber += 1;
	const now = new Date();
	try {
		await getCollectionHelper().createAppUsageEvent({
			event_type: event.event_type,
			event_name: event.event_name,
			screen_name: event.screen_name ?? null,
			platform: Platform.OS,
			app_version: getVersion(),
			client_timestamp: getLocalTimestamp(now),
			session_id: getAppUsageSessionId(),
			sequence_number: sequenceNumber,
			payload: {
				version_internal: getVersionInternalForAppsettingsScreen(),
				// Minutes the local time is behind UTC, as `Date.getTimezoneOffset` reports it.
				timezone_offset_minutes: now.getTimezoneOffset(),
				...event.payload,
			},
			payload_boolean: event.payload_boolean ?? null,
			payload_number: event.payload_number ?? null,
			payload_datetime: event.payload_datetime ?? null,
		});
		return true;
	} catch (error) {
		console.log('AppUsageEventHelper: could not send app usage event', error);
		return false;
	}
};

/**
 * Reports that the native store review dialog is about to be requested. Call
 * this directly before `StoreReview.requestReview()` and do not await it, so the
 * dialog is not delayed by the network request.
 */
export const trackNativeReviewPromptRequested = (params: { source: AppRatingPromptSource; score?: number | null }) =>
	trackAppUsageEvent({
		event_type: APP_USAGE_EVENT_TYPE_APP_RATING,
		event_name: APP_USAGE_EVENT_NAME_NATIVE_REVIEW_PROMPT_REQUESTED,
		screen_name: params.source,
		payload_number: params.score ?? null,
		payload: {
			source: params.source,
			score: params.score ?? null,
		},
	});

/**
 * Reports that a screen was opened. `eventName` is one of the `*_SCREEN_OPENED`
 * names, `screenName` the route of the screen.
 */
export const trackScreenOpened = (params: { eventName: AppUsageEventName; screenName: string }) =>
	trackAppUsageEvent({
		event_type: AppUsageEventTypes.SCREEN_VIEW,
		event_name: params.eventName,
		screen_name: params.screenName,
	});

/**
 * Reports that the details of a building were opened. The id lets the page
 * "Live-Puls" link to the building.
 */
export const trackBuildingDetailsOpened = (params: { buildingId: string; buildingName?: string | null; screenName?: string | null }) =>
	trackAppUsageEvent({
		event_type: AppUsageEventTypes.BUILDING,
		event_name: AppUsageEventNames.BUILDING_DETAILS_OPENED,
		screen_name: params.screenName ?? null,
		payload: {
			building_id: params.buildingId,
			building_name: params.buildingName ?? null,
		},
	});

/**
 * Reports that the details of a marking were opened. The id lets the page
 * "Live-Puls" link to the marking.
 */
export const trackMarkingDetailsOpened = (params: { markingId: string; markingName?: string | null; screenName?: string | null }) =>
	trackAppUsageEvent({
		event_type: AppUsageEventTypes.MARKING,
		event_name: AppUsageEventNames.MARKING_DETAILS_OPENED,
		screen_name: params.screenName ?? null,
		payload: {
			marking_id: params.markingId,
			marking_name: params.markingName ?? null,
		},
	});

/**
 * Starts a new session id and sequence numbering. Only used by tests.
 */
export const resetAppUsageEventSession = () => {
	sessionId = null;
	sequenceNumber = 0;
	collectionHelper = null;
};

/**
 * After the app started (or the user logged in) with a login via university (DFN): the answer of
 * `GET /university-affiliation`, whatever status the university reported.
 */
export const trackUniversityStatusChecked = (universityAffiliation: Record<string, unknown>) =>
	trackAppUsageEvent({
		event_type: AppUsageEventTypes.ACCOUNT,
		event_name: AppUsageEventNames.UNIVERSITY_STATUS_CHECKED,
		payload: universityAffiliation,
	});
