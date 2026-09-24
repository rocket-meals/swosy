import { useMemo } from 'react';
import { shallowEqual } from 'react-redux';
import { FoodFeedbackPermissionHelper, FoodFeedbackPermissions, GuestAccountHelper } from 'repo-depkit-common';
import { useAppSelector } from '@/redux/hooks';

// What the current user may do with food feedbacks. Guests get their own app settings
// (foods_ratings_guests_enabled, foods_feedbacks_comments_type_guests); the backend enforces
// the same rules in food-feedback-guest-restriction-hook.
const useFoodFeedbackPermissions = (): FoodFeedbackPermissions => {
	const userEmail = useAppSelector(state => state.authReducer.user?.email);
	const appSettings = useAppSelector(state => state.settings.appSettings, shallowEqual);
	const isGuest = GuestAccountHelper.isGuestEmail(userEmail);

	return useMemo(() => FoodFeedbackPermissionHelper.getPermissions(appSettings, isGuest), [appSettings, isGuest]);
};

export default useFoodFeedbackPermissions;
