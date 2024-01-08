import React, {FunctionComponent, useState} from "react";
import {Animated} from "react-native";

interface FadeInFadeOutProps {
	duration?: number;
}
export const FadeInFadeOut: FunctionComponent<FadeInFadeOutProps> = props => {

	// a small animated view which loops between 0 and 1 opacity
	const [fadeAnim] = useState(new Animated.Value(0));
	const duration = props?.duration || 1000;

	React.useEffect(() => {
		Animated.loop(
			Animated.sequence([
				Animated.timing(fadeAnim, {
					toValue: 1,
					duration: duration,
					useNativeDriver: true // Add This line
				}),
				Animated.timing(fadeAnim, {
					toValue: 0,
					duration: duration,
					useNativeDriver: true // Add This line
				}),
			])
		).start();
	}	, []);

	return (
		<Animated.View
			style={{
				opacity: fadeAnim,
			}}
		>
			{props.children}
		</Animated.View>

	);

}
