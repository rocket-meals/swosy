import React, {FunctionComponent} from 'react';
import {useViewBackgroundColor, View} from '@/components/Themed';
import {useMyContrastColor} from "@/helper/color/MyContrastColor";

export const MyDivider: FunctionComponent = (props) => {

	let backgroundColor = useViewBackgroundColor()
	const backgroundContrastColor = useMyContrastColor(backgroundColor)

	return(
		<>
			<View style={{height: 16}}></View>
			<View style={{width: '100%', height: 1, backgroundColor: backgroundContrastColor}}></View>
			<View style={{height: 16}}></View>
		</>
	)
}
