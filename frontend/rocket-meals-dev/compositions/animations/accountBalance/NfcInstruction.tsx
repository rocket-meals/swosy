// @ts-nocheck
import React from 'react';
import {CrossLottie, Layout} from '../../../../kitcheningredients';
import { View, useBreakpointValue} from 'native-base';
import Rectangle from '../../../helper/Rectangle';
import nfcInstruction from '../../../assets/accountBalance/nfcInstruction.json';

export const NfcInstruction = ({children,...props}: any) => {
	const noFoundWidths = {
		base: '100%',
		sm: '70%',
		md: Layout.WIDTH_MD*0.3,
		lg: Layout.WIDTH_LG*0.3,
		xl: Layout.WIDTH_XL*0.2
	}
	const noFoundWidth = useBreakpointValue(noFoundWidths);

	return (
		<View style={{width: '100%', alignItems: 'center'}}>
			<View style={{width: noFoundWidth}}>
				<Rectangle>
					<CrossLottie source={nfcInstruction} flex={1} />
				</Rectangle>
			</View>
		</View>
	)
}
