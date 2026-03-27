import React from 'react';
import { View } from 'react-native';
import { FeatureWishesScreen, useTheme } from 'repo-depkit-common-ui';

const FeatureWishesRoute = () => {
	const { theme } = useTheme();

	return (
		<View style={{ flex: 1, backgroundColor: theme.screen.background }}>
			<FeatureWishesScreen />
		</View>
	);
};

export default FeatureWishesRoute;
