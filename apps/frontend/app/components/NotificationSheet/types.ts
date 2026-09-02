import { DatabaseTypes } from 'repo-depkit-common';

/**
 * `confirm` asks the user to switch the reminder on (used where the app cannot ask for a system
 * permission, e.g. on the web), `permission-required` explains that the notification permission
 * has to be granted in the system settings first.
 */
export type NotificationSheetVariant = 'confirm' | 'permission-required';

export interface NotificationSheetProps {
	closeSheet: () => void;
	variant?: NotificationSheetVariant;
	previousFeedback: DatabaseTypes.FoodsFeedbacks;
	foodDetails: DatabaseTypes.Foods;
}
