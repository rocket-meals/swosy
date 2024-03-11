// @ts-nocheck
import React from 'react';
import {CrossLottie, Layout} from '../../../../kitcheningredients';
import { View, useBreakpointValue} from 'native-base';
import Rectangle from '../../../helper/Rectangle';
import moneySad from '../../../assets/accountBalance/moneySad.json';

export const MoneySad = ({children,...props}: any) => {
	const noFoundWidths = {
		base: '40%',
		sm: '30%',
		md: Layout.WIDTH_MD*0.3,
		lg: Layout.WIDTH_LG*0.3,
		xl: Layout.WIDTH_XL*0.2
	}
	const noFoundWidth = useBreakpointValue(noFoundWidths);

	return (
		<View style={{width: '100%', alignItems: 'center'}}>
			<View style={{width: noFoundWidth}}>
				<Rectangle>
					<CrossLottie source={moneySad} flex={1} />
				</Rectangle>
			</View>
		</View>
	)
}
