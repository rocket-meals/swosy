import React from 'react';
import { Redirect } from 'expo-router';

// Always start at onboarding; onboarding handles routing to food offers
// (complete-profile users see "welcome back" + press "Weiter" themselves).
const Home = () => {
	return <Redirect href="/(app)/experimentell/onboarding" />;
};

export default Home;
