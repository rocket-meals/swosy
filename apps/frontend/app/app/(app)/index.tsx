import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useDispatch } from 'react-redux';
import { AppScreens } from 'repo-depkit-common';
import { useAppSelector } from '@/redux/hooks';
import { UPDATE_PROFILE } from '@/redux/Types/types';
import { consumeShouldShowOnboardingAfterLogin } from '@/helper/onboardingIntentHelper';

// Onboarding is only ever entered right after a fresh login (see app/index.tsx and
// (app)/_layout.tsx, which set the flag consumed below just before sending an
// unauthenticated user to the login screen) - never from this profile-completeness check
// alone. Otherwise a rehydration hiccup that makes profile.canteen/price_group look
// incomplete would send a returning user through onboarding on every single app start.
const Home = () => {
	const dispatch = useDispatch();
	const { profile } = useAppSelector((state) => state.authReducer);
	const { selectedCanteen } = useAppSelector((state) => state.canteenReducer);
	const [shouldShowOnboarding] = useState(() => consumeShouldShowOnboardingAfterLogin());

	// Sessions from before profile.canteen was persisted (older app versions only ever set
	// the separately-tracked selectedCanteen) would look incomplete forever and be sent
	// through onboarding on every start - accept selectedCanteen as proof of a completed
	// canteen setup too.
	const hasCanteen = !!profile?.canteen || !!selectedCanteen?.id;
	const hasCompleteProfile = hasCanteen && !!profile?.price_group;

	// Backfill profile.canteen from the legacy selectedCanteen so future checks (and the
	// server sync for registered users in (app)/_layout's syncProfileDefaults) see it too.
	useEffect(() => {
		if (!profile?.canteen && selectedCanteen?.id) {
			dispatch({ type: UPDATE_PROFILE, payload: { ...profile, canteen: selectedCanteen.id } });
		}
	}, [profile, selectedCanteen?.id, dispatch]);

	if (!hasCompleteProfile && shouldShowOnboarding) {
		return <Redirect href="/(app)/experimentell/onboarding" />;
	}
	return <Redirect href={('/(app)/' + AppScreens.FOOD_OFFERS) as any} />;
};

export default Home;
