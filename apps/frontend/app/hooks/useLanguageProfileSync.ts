import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { findMatchingLanguageCode, getLanguageCodeFromRelation, isSameLanguageCode, toFullLanguageCode } from 'repo-depkit-common';
import { useAppSelector } from '@/redux/hooks';
import { configureStore } from '@/redux/store';
import { CHANGE_LANGUAGE, UPDATE_PROFILE } from '@/redux/Types/types';
import { ProfileHelper } from '@/redux/actions/Profile/Profile';
import { LanguageCodesCache } from '@/redux/actions/Languages/Languages';
import { UserHelper } from '@/helper/UserHelper';

export type ProfileLanguageSyncPlan = {
	/** The code to store locally instead, when the server spells the same language differently ("de-AT"). */
	localLanguage?: string;
	/** The code to write to `profiles.language`, when the profile has another one or none. */
	profileLanguage?: string;
};

/**
 * What to change so that app and profile name the same language.
 *
 * The app is the source of truth: it is the language the user sees and chose (older app versions
 * kept `profiles.language` from back then, which may be outdated), so a differing profile value is
 * overwritten, never the other way round. The code is taken from the server's `languages` table,
 * because `profiles.language` is a relation to it. `availableCodes` is null when the table could not
 * be read: the app's own code is used then. A language the table does not offer is not written,
 * the server would refuse it, and the backend falls back to German on its own.
 */
export function planProfileLanguageSync(localLanguage: string | null | undefined, availableCodes: readonly string[] | null, profileLanguage: string | null | undefined): ProfileLanguageSyncPlan {
	const fullLanguage = toFullLanguageCode(localLanguage);
	if (!fullLanguage) {
		return {};
	}
	const targetLanguage = availableCodes && availableCodes.length > 0 ? findMatchingLanguageCode(fullLanguage, availableCodes) : fullLanguage;
	if (!targetLanguage) {
		return {};
	}
	return {
		localLanguage: targetLanguage === localLanguage ? undefined : targetLanguage,
		profileLanguage: isSameLanguageCode(profileLanguage, targetLanguage) ? undefined : targetLanguage,
	};
}

/**
 * Keeps the app language and `profiles.language` in line, so the server writes push notifications,
 * mails and chat titles in the language the user reads the app in.
 *
 * - Converts the short code older app versions stored (`"de"`) to the full one (`"de-DE"`), for every
 *   user and without network. The language the user sees does not change.
 * - For registered users with a server profile: on app start (the profile is fetched then) and after
 *   every language change, writes the language to the profile when it differs. Only this field is
 *   sent, and `ProfileHelper.updateProfile` never sends it, so no other write puts an old value back.
 *
 * Fire and forget: a failed write is logged and tried again on the next start or language change.
 */
export function useLanguageProfileSync() {
	const dispatch = useDispatch();
	const language = useAppSelector(state => state.settings.language);
	const { loggedIn, user, profile } = useAppSelector(state => state.authReducer);
	const profileId: string | undefined = profile?.id ?? undefined;
	const profileLanguage = getLanguageCodeFromRelation(profile?.language);
	// Only a profile that belongs to the logged in account (not the kiosk demo profile).
	const canWriteProfile = Boolean(loggedIn && UserHelper.isRegisteredUser(user) && profileId && user?.profile === profileId);
	const writeInFlight = useRef<string | null>(null);

	useEffect(() => {
		const fullLanguage = toFullLanguageCode(language);
		if (fullLanguage && fullLanguage !== language) {
			// Runs again with the full code.
			dispatch({ type: CHANGE_LANGUAGE, payload: fullLanguage });
			return;
		}
		if (!fullLanguage || !canWriteProfile || !profileId) {
			return;
		}

		const run = { cancelled: false };
		void (async () => {
			const availableCodes = await LanguageCodesCache.getLanguageCodes();
			if (run.cancelled) return;
			const plan = planProfileLanguageSync(language, availableCodes, profileLanguage);
			if (plan.localLanguage) {
				// Runs again with the server's spelling and writes that one.
				dispatch({ type: CHANGE_LANGUAGE, payload: plan.localLanguage });
				return;
			}
			if (!plan.profileLanguage || writeInFlight.current === plan.profileLanguage) return;

			writeInFlight.current = plan.profileLanguage;
			try {
				await new ProfileHelper().updateItem(profileId, { language: plan.profileLanguage });
				const currentProfile = configureStore.getState().authReducer.profile;
				if (currentProfile?.id === profileId) {
					dispatch({ type: UPDATE_PROFILE, payload: { ...currentProfile, language: plan.profileLanguage } });
				}
			} catch (error) {
				console.error('useLanguageProfileSync: could not save the language in the profile', error);
			} finally {
				writeInFlight.current = null;
			}
		})();
		return () => {
			run.cancelled = true;
		};
	}, [language, canWriteProfile, profileId, profileLanguage]);
}
