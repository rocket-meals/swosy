// @ts-nocheck
import React from 'react';
import {Box,} from 'native-base';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

export const SafeAreaBottom = ({
	children,
	navigation,
	title,
	doclink,
	navigateTo,
	_status,
	_hStack,
	...props
}: any) => {
	const safeArea = useSafeAreaInsets();

	return (
			<Box
				{...props}
				height={safeArea.bottom}
				_web={{
					pt: {
						base: 6,
						sm: 6,
						md: 0,
					},
				}}
				/>
	);
};
