import React from 'react';
import {
	DEFAULT_COLOR_TO_BE_REPLACED,
	DEFAULT_COLOR_TO_REPLACE_WITH,
	MyLottieAnimation,
	MyLottieAnimationProps
} from '@/components/lottie/MyLottieAnimation';
import {useProjectColor} from '@/states/ProjectInfo';

/**
 * A component that displays a Lottie animation, but automatically applies a color replacement based on the project colors
 */
export const MyProjectColoredLottieAnimation = ({colorReplaceMap, ...props}: MyLottieAnimationProps) => {
	const projectColor = useProjectColor();
	const usedProjectColor = projectColor ? projectColor : DEFAULT_COLOR_TO_REPLACE_WITH

	let usedColorReplaceMap = colorReplaceMap;
	if (!usedColorReplaceMap) {
		usedColorReplaceMap = {}
	}

	if (!usedColorReplaceMap[DEFAULT_COLOR_TO_BE_REPLACED]) {
		usedColorReplaceMap[DEFAULT_COLOR_TO_BE_REPLACED] = usedProjectColor
	}

	return <MyLottieAnimation {...props} colorReplaceMap={usedColorReplaceMap} />
}
