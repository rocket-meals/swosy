/**
 * An error report is filled in by the app, not by the user: it has to reach
 * support with the error, the device and the profile already in it.
 */
const mockCreateAppFeedback = jest.fn();

jest.mock('@/redux/actions/AppFeedback/AppFeedback', () => ({
	AppFeedback: jest.fn().mockImplementation(() => ({ createAppFeedback: mockCreateAppFeedback })),
}));
jest.mock('@/redux/store', () => ({
	configureStore: { getState: () => ({ authReducer: { profile: { id: 'profile-1' } } }) },
}));
jest.mock('@/helper/appStateForFeedback', () => ({
	buildAppStateJsonForFeedback: () => '{"settings":{}}',
}));
jest.mock('@/config', () => ({
	getVersionInternalForAppsettingsScreen: () => '21.210.65',
}));
jest.mock('expo-device', () => ({ brand: 'google', modelName: 'Pixel 8', osVersion: '16' }));

import { buildErrorReportText, sendErrorReport } from '../helper/errorReport';

describe('error reports', () => {
	beforeEach(() => mockCreateAppFeedback.mockReset());

	it('names the error, the app version and the device in the text', () => {
		const text = buildErrorReportText({ area: 'text-recognition', message: 'the text recognition engine could not be started: boom' });
		expect(text).toContain('Area: text-recognition');
		expect(text).toContain('Error: the text recognition engine could not be started: boom');
		expect(text).toContain('App version: 21.210.65');
		expect(text).toContain('Device: google Pixel 8');
	});

	it('creates an app feedback with title, content, profile, device fields and app state', async () => {
		await sendErrorReport('Fehlerbericht: Texterkennung', { area: 'text-recognition', message: 'boom' });

		expect(mockCreateAppFeedback).toHaveBeenCalledTimes(1);
		const report = mockCreateAppFeedback.mock.calls[0][0];
		expect(report.title).toBe('Fehlerbericht: Texterkennung');
		expect(report.content).toContain('Error: boom');
		expect(report.profile).toBe('profile-1');
		expect(report.positive).toBe(false);
		expect(report.device_brand).toBe('google');
		expect(report.device_system_version).toBe('16');
		expect(typeof report.device_platform).toBe('string');
		expect(report.data).toBeDefined();
	});

	it('lets the caller know when the server refuses the report', async () => {
		mockCreateAppFeedback.mockRejectedValueOnce(new Error('forbidden'));
		await expect(sendErrorReport('title', { area: 'text-recognition', message: 'boom' })).rejects.toThrow('forbidden');
	});
});
