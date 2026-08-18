type AppUsageEventPayload = Record<string, any>;

const mockCreateAppUsageEvent = jest.fn(async (_data: AppUsageEventPayload) => ({}));

jest.mock('@/redux/actions/AppUsageEvents/AppUsageEvents', () => ({
	AppUsageEvents: jest.fn().mockImplementation(() => ({
		createAppUsageEvent: mockCreateAppUsageEvent,
	})),
}));

jest.mock('repo-depkit-common', () => ({
	UuidHelper: { randomUUID: jest.fn(() => 'test-session-uuid') },
}));

jest.mock('@/config', () => ({
	getVersion: () => '21.206.0',
	getVersionInternalForAppsettingsScreen: () => '21.206.19',
}));

import {
	APP_USAGE_EVENT_NAME_NATIVE_REVIEW_PROMPT_REQUESTED,
	APP_USAGE_EVENT_TYPE_APP_RATING,
	AppRatingPromptSources,
	getAppUsageSessionId,
	resetAppUsageEventSession,
	trackNativeReviewPromptRequested,
} from '@/helper/AppUsageEventHelper';

describe('trackNativeReviewPromptRequested', () => {
	beforeEach(() => {
		mockCreateAppUsageEvent.mockClear();
		mockCreateAppUsageEvent.mockImplementation(async () => ({}));
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
