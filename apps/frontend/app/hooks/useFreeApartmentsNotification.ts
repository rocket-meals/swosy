import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { DatabaseTypes } from 'repo-depkit-common';

import useAccountRequiredModal from '@/hooks/useAccountRequiredModal';
import usePushNotificationOptInPrompt from '@/hooks/usePushNotificationOptInPrompt';
import useToast from '@/hooks/useToast';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import { ProfileHelper } from '@/redux/actions/Profile/Profile';
import { useAppSelector } from '@/redux/hooks';
import { UPDATE_PROFILE } from '@/redux/Types/types';

/**
 * Whether the user wants a push notification when an apartment becomes free
 * (`profiles.notifiy_on_free_apartments`). Switching it on first asks for the push permission
 * (our explanation, then the system dialog), without it the notification could never arrive.
 */
const useFreeApartmentsNotification = () => {
	const dispatch = useDispatch();
	const { translate } = useLanguage();
	const toast = useToast();
	const user = useAppSelector(state => state.authReducer.user);
	const profile = useAppSelector(state => state.authReducer.profile);
	const { openAccountRequiredModal } = useAccountRequiredModal();
	const { ensurePushNotificationPermission } = usePushNotificationOptInPrompt();
	const [saving, setSaving] = useState(false);

	const isAccountRequired = !user?.id || !profile?.id;
	const isEnabled = !!profile?.notifiy_on_free_apartments;

	const setEnabled = useCallback(
		async (enabled: boolean) => {
			if (isAccountRequired) {
				openAccountRequiredModal();
				return;
			}
			if (enabled && !(await ensurePushNotificationPermission())) {
				return;
			}
			setSaving(true);
			try {
				const result = (await new ProfileHelper().updateProfile({ id: profile.id, notifiy_on_free_apartments: enabled })) as DatabaseTypes.Profiles;
				if (result) {
					dispatch({ type: UPDATE_PROFILE, payload: result });
				}
			} catch (e) {
				console.error('useFreeApartmentsNotification: could not update the profile', e);
				toast(translate(TranslationKeys.error), 'error');
			} finally {
				setSaving(false);
			}
		},
		[dispatch, ensurePushNotificationPermission, isAccountRequired, openAccountRequiredModal, profile?.id, toast, translate]
	);

	const toggle = useCallback(() => setEnabled(!isEnabled), [isEnabled, setEnabled]);

	return { isEnabled, isAccountRequired, saving, setEnabled, toggle, openAccountRequiredModal };
};

export default useFreeApartmentsNotification;
