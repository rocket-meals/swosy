import React from 'react';
import {MySafeAreaViewThemed} from '@/components/MySafeAreaViewThemed';
import {Heading, View} from '@/components/Themed';
import {CanteenSelectGridList} from '@/compositions/resourceGridList/canteenSelectGridList';

export default function SettingsScreen() {

	return (
		<MySafeAreaViewThemed>
			<Heading>{'Canteens'}</Heading>
			<View style={{
				width: '100%',
				height: '100%',
				flex: 1,
			}}
			>
				<CanteenSelectGridList />
			</View>
		</MySafeAreaViewThemed>
	);
}
