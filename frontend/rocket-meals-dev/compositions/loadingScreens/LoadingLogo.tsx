import React from 'react';
import * as rocketSource from '@/assets/animations/rocket_purple.json';
import {MyProjectColoredLottieAnimation} from '@/components/lottie/MyProjectColoredLottieAnimation';
import {useProjectLogoAssetId} from "@/states/ProjectInfo";
import {ProjectLogo} from "@/components/project/ProjectLogo";

export const LoadingLogo = ({...props}) => {

	const height = props.height || 200;
	const width = props.width || 200;

	const projectLogoAssetId = useProjectLogoAssetId()

	if (projectLogoAssetId) {
		return <ProjectLogo style={{width: width, height: height}}/>
	}

	return <MyProjectColoredLottieAnimation source={rocketSource} accessibilityLabel={'Rocket'} style={{width: width, height: height}}/>;
}
