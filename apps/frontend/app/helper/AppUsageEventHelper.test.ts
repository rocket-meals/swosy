type AppUsageEventPayload = Record<string, any>;

const mockCreateAppUsageEvent = jest.fn(async (_data: AppUsageEventPayload) => ({}));

jest.mock('@/redux/actions/AppUsageEvents/AppUsageEvents', () => ({
	AppUsageEvents: jest.fn().mockImplementation(() => ({
		createAppUsageEvent: mockCreateAppUsageEvent,
	})),
}));

jest.mock('repo-depkit-common', () => ({
	...jest.requireActual('repo-depkit-common/src/AppUsageEventNames'),
	UuidHelper: { randomUUID: jest.fn(() => 'test-session-uuid') },
}));

const mockAppSettings: { app_usage_events_enabled?: unknown } = {};

jest.mock('@/redux/store', () => ({
	configureStore: { getState: () => ({ settings: { appSettings: mockAppSettings } }) },
}));

jest.mock('@/config', () => ({
	getVersion: () => '21.206.0',
	getVersionInternalForAppsettingsScreen: () => '21.206.19',
}));

import { AppUsageEventNames } from 'repo-depkit-common/src/AppUsageEventNames';
import {
	APP_USAGE_EVENT_NAME_NATIVE_REVIEW_PROMPT_REQUESTED,
	APP_USAGE_EVENT_TYPE_APP_RATING,
	AppRatingPromptSources,
	getAppUsageSessionId,
	resetAppUsageEventSession,
	trackBuildingDetailsOpened,
	trackMarkingDetailsOpened,
	trackNativeReviewPromptRequested,
	trackScreenOpened,
} from '@/helper/AppUsageEventHelper';

describe('trackNativeReviewPromptRequested', () => {
	beforeEach(() => {
		mockCreateAppUsageEvent.mockClear();
		mockCreateAppUsageEvent.mockImplementation(async () => ({}));
		delete mockAppSettings.app_usage_events_enabled;
		resetAppUsageEventSession();
	});

	it('reports the event with the source, the score and the app context', async () => {
		const sent = await trackNativeReviewPromptRequested({
			source: AppRatingPromptSources.SCORE_THRESHOLD,
			score: 110,
		});

		expect(sent).toBe(true);
		expect(mockCreateAppUsageEvent).toHaveBeenCalledTimes(1);

		const event = mockCreateAppUsageEvent.mock.calls[0][0];
		expect(event.event_type).toBe(APP_USAGE_EVENT_TYPE_APP_RATING);
		expect(event.event_name).toBe(APP_USAGE_EVENT_NAME_NATIVE_REVIEW_PROMPT_REQUESTED);
		expect(event.screen_name).toBe(AppRatingPromptSources.SCORE_THRESHOLD);
		expect(event.payload_number).toBe(110);
		expect(event.payload).toEqual({
			source: AppRatingPromptSources.SCORE_THRESHOLD,
			score: 110,
			version_internal: '21.206.19',
			timezone_offset_minutes: new Date().getTimezoneOffset(),
		});
		expect(event.app_version).toBe('21.206.0');
		expect(event.session_id).toBe('test-session-uuid');
		expect(event.sequence_number).toBe(1);
		// Directus stores `client_timestamp` without a timezone, so no `Z`/offset suffix.
		expect(event.client_timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
	});

	it('keeps the session id and counts the events of that session up', async () => {
		await trackNativeReviewPromptRequested({ source: AppRatingPromptSources.RATE_APP_ITEM });
		await trackNativeReviewPromptRequested({ source: AppRatingPromptSources.RATE_APP_ITEM });

		const [first, second] = mockCreateAppUsageEvent.mock.calls.map(call => call[0]);
		expect(first.session_id).toBe(second.session_id);
		expect(first.session_id).toBe(getAppUsageSessionId());
		expect(first.sequence_number).toBe(1);
		expect(second.sequence_number).toBe(2);
	});

	it('reports no score when the prompt was not triggered by the rating score', async () => {
		await trackNativeReviewPromptRequested({ source: AppRatingPromptSources.COLLECTIBLE_EVENT_CONGRATULATIONS });

		const event = mockCreateAppUsageEvent.mock.calls[0][0];
		expect(event.payload_number).toBeNull();
		expect(event.payload.score).toBeNull();
	});

	it('never rejects when the event cannot be sent', async () => {
		mockCreateAppUsageEvent.mockImplementation(async () => {
			throw new Error('offline');
		});

		await expect(trackNativeReviewPromptRequested({ source: AppRatingPromptSources.SCORE_THRESHOLD })).resolves.toBe(false);
	});
});

describe('app_settings.app_usage_events_enabled', () => {
	beforeEach(() => {
		mockCreateAppUsageEvent.mockClear();
		mockCreateAppUsageEvent.mockImplementation(async () => ({}));
		delete mockAppSettings.app_usage_events_enabled;
		resetAppUsageEventSession();
	});

	it('sends only the selected events and does not count the dropped ones', async () => {
		mockAppSettings.app_usage_events_enabled = [AppUsageEventNames.MAP_SCREEN_OPENED];

		await expect(trackScreenOpened({ eventName: AppUsageEventNames.NEWS_SCREEN_OPENED, screenName: 'news' })).resolves.toBe(false);
		await expect(trackScreenOpened({ eventName: AppUsageEventNames.MAP_SCREEN_OPENED, screenName: 'map' })).resolves.toBe(true);

		expect(mockCreateAppUsageEvent).toHaveBeenCalledTimes(1);
		const event = mockCreateAppUsageEvent.mock.calls[0][0];
		expect(event.event_type).toBe('screen_view');
		expect(event.event_name).toBe(AppUsageEventNames.MAP_SCREEN_OPENED);
		expect(event.screen_name).toBe('map');
		expect(event.sequence_number).toBe(1);
	});

	it('sends nothing when nothing is ticked', async () => {
		mockAppSettings.app_usage_events_enabled = [];

		await trackScreenOpened({ eventName: AppUsageEventNames.MAP_SCREEN_OPENED, screenName: 'map' });
		await trackNativeReviewPromptRequested({ source: AppRatingPromptSources.SCORE_THRESHOLD });

		expect(mockCreateAppUsageEvent).not.toHaveBeenCalled();
	});

	it('reports opened buildings and markings with their id for the links in "Live-Puls"', async () => {
		await trackBuildingDetailsOpened({ buildingId: 'b1', buildingName: 'Mensa' });
		await trackMarkingDetailsOpened({ markingId: 'm1', markingName: 'Vegan' });

		const [building, marking] = mockCreateAppUsageEvent.mock.calls.map(call => call[0]);
		expect(building.event_name).toBe(AppUsageEventNames.BUILDING_DETAILS_OPENED);
		expect(building.payload).toMatchObject({ building_id: 'b1', building_name: 'Mensa' });
		expect(marking.event_name).toBe(AppUsageEventNames.MARKING_DETAILS_OPENED);
		expect(marking.payload).toMatchObject({ marking_id: 'm1', marking_name: 'Vegan' });
	});
});
