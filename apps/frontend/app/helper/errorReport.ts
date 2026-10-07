import { Dimensions, PixelRatio, Platform } from 'react-native';
import * as DeviceInfo from 'expo-device';
import { AppFeedbackContentHelper, DatabaseTypes } from 'repo-depkit-common';

import { getVersionInternalForAppsettingsScreen } from '@/config';
import { buildAppStateJsonForFeedback } from '@/helper/appStateForFeedback';
import { ServerAPI } from '@/redux/actions/Auth/Auth';
import { AppFeedback } from '@/redux/actions/AppFeedback/AppFeedback';
import { configureStore } from '@/redux/store';

/**
 * Error reports that reach support without the user filling in a form.
 *
 * A report is an ordinary `app_feedbacks` entry - the same one the
 * feedback-support screen writes - so it lands in the same inbox, carries the
 * same device fields and app state, and shows up in the user's own ticket list.
 * The difference is only who fills it in: here the app does.
 */

/** The platform as the feedback-support screen names it. */
const getPlatformName = (): string => {
	if (Platform.OS === 'web') {
		return 'Web';
	}
	if (Platform.OS === 'ios') {
		return 'iOS';
	}
	return 'Android';
};

/** The device fields of an `app_feedbacks` entry, read off this device. */
export const collectDeviceFeedbackFields = () => {
	const screen = Dimensions.get('screen');
	return {
		device_brand: DeviceInfo.brand,
		device_system_version: DeviceInfo.osVersion,
		device_platform: getPlatformName(),
		display_height: screen.height,
		display_width: screen.width,
		display_fontscale: PixelRatio?.getFontScale(),
		display_pixelratio: PixelRatio?.get(),
		display_scale: screen.scale,
	};
};

/** What went wrong, where, and on what - enough for support to start without asking back. */
export interface ErrorReportDetails {
	/** Which part of the app failed, e.g. `text-recognition`. Not translated: it is for support. */
	area: string;
	/** The error message as the code produced it. */
	message: string;
}

/**
 * The report as plain text: for the clipboard and for the `content` column.
 * Deliberately untranslated - it is read by support, not by the user.
 */
export const buildErrorReportText = ({ area, message }: ErrorReportDetails): string => {
	const lines = [
		`Area: ${area}`,
		`Error: ${message}`,
		`App version: ${getVersionInternalForAppsettingsScreen()}`,
		`Platform: ${getPlatformName()} ${DeviceInfo.osVersion ?? ''}`.trim(),
		`Device: ${[DeviceInfo.brand, DeviceInfo.modelName].filter(Boolean).join(' ') || 'unknown'}`,
		`Time: ${new Date().toISOString()}`,
	];
	return lines.join('\n');
};

/**
 * Creates the `app_feedbacks` entry for an error, with device fields, the
 * logged-in profile and the app state filled in. Throws when the server
 * refuses it, so the caller can say so.
 */
export const sendErrorReport = async (title: string, details: ErrorReportDetails): Promise<void> => {
	const state = configureStore.getState();
	const profileId = state.authReducer?.profile?.id;

	const report: Partial<DatabaseTypes.AppFeedbacks> & { [key: string]: unknown } = {
		title,
		content: buildErrorReportText(details),
		positive: false,
		...collectDeviceFeedbackFields(),
	};
	if (profileId) {
		report.profile = profileId;
	}
	try {
		const session = await ServerAPI.getSessionDiagnostics();
		report.data = AppFeedbackContentHelper.buildAppStateData(buildAppStateJsonForFeedback(state, { session }));
	} catch (error) {
		// The report is worth more than the snapshot: send it with the reason instead.
		report.data = AppFeedbackContentHelper.buildAppStateErrorData(error);
	}

	await new AppFeedback().createAppFeedback(report as Partial<DatabaseTypes.AppFeedbacks>);
};
