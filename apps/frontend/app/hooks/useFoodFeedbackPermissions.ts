import { useMemo } from 'react';
import { shallowEqual } from 'react-redux';
import { FoodFeedbackPermissionHelper, FoodFeedbackPermissions } from 'repo-depkit-common';
import { useAppSelector } from '@/redux/hooks';

// What the current user may do with food feedbacks. Unverified profiles (profiles.verified === false,
// e.g. guests without an own email address) get their own app settings. The backend enforces the
// same rules in food-feedback-guest-restriction-hook.
const useFoodFeedbackPermissions = (): FoodFeedbackPermissions => {
	const profileVerified = useAppSelector(state => state.authReducer.profile?.verified);
	const appSettings = useAppSelector(state => state.settings.appSettings, shallowEqual);
	const isUnverified = profileVerified === false;

	return useMemo(() => FoodFeedbackPermissionHelper.getPermissions(appSettings, isUnverified), [appSettings, isUnverified]);
};

export default useFoodFeedbackPermissions;
