import React from 'react';
import * as rocketSource from '@/assets/animations/rocket_purple.json';
import {MyProjectColoredLottieAnimation} from '@/components/lottie/MyProjectColoredLottieAnimation';

export const LoadingLogo = ({...props}) => {

	const height = props.height || 200;
	const width = props.width || 200;

	return <MyProjectColoredLottieAnimation source={rocketSource} accessibilityLabel={'Rocket'} style={{width: width, height: height}}/>;
}
