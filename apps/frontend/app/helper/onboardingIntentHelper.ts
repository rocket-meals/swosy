// In-memory (deliberately not persisted) flag marking that the user is going through the
// login flow and should be offered onboarding once logged in, if their profile is still
// incomplete. Onboarding must only ever be entered this way - not from a profile-completeness
// check on every app start - otherwise a rehydration hiccup (e.g. AsyncStorage write
// failures) sends returning users through onboarding on every launch.
let shouldShowOnboardingAfterLogin = false;

export function markOnboardingShouldBeShownAfterLogin() {
	shouldShowOnboardingAfterLogin = true;
}

// Reads and resets the flag in one step so it is only ever honoured once per login.
export function consumeShouldShowOnboardingAfterLogin(): boolean {
	const value = shouldShowOnboardingAfterLogin;
	shouldShowOnboardingAfterLogin = false;
	return value;
}
