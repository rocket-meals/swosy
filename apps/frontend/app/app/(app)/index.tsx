import React from 'react';
import { Redirect } from 'expo-router';
import { AppScreens } from 'repo-depkit-common';
import { useAppSelector } from '@/redux/hooks';

// Skip onboarding entirely once canteen + price_group are both already set (checked
// synchronously from the persisted profile, no network round-trip needed) - otherwise
// onboarding would still mount and briefly flash before redirecting itself.
const Home = () => {
	const { profile } = useAppSelector((state) => state.authReducer);
	const hasCompleteProfile = !!profile?.canteen && !!profile?.price_group;

	if (hasCompleteProfile) {
		return <Redirect href={('/(app)/' + AppScreens.FOOD_OFFERS) as any} />;
	}
	return <Redirect href="/(app)/experimentell/onboarding" />;
};

export default Home;
