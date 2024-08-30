import React, {useEffect, useRef} from "react";
import {Animated} from "react-native";
import {View} from "@/components/Themed";

type ProgressBarProps = {
    duration: number,
    color: string,
    backgroundColor?: string
}
export const MyProgressbar: React.FC<ProgressBarProps> = ({ duration, color, backgroundColor }) => {
    const progress = useRef(new Animated.Value(0)).current;


    if(duration <= 0){
        return null;
    }

    useEffect(() => {
        // Start the animation when the component mounts
        Animated.timing(progress, {
            toValue: 100, // Animate the progress to 100%
            duration: duration * 1000, // Convert duration to milliseconds
            useNativeDriver: false, // useNativeDriver is false because we're animating layout properties
        }).start();
    }, [duration, progress]);

    // Interpolate the animated value to convert it to width percentage
    const widthInterpolation = progress.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={{
            height: "100%",
            width: "100%",
            overflow: "hidden",
            backgroundColor: backgroundColor
        }}>
            <Animated.View
                style={[
                    {
                        height: "100%",
                        borderBottomRightRadius: 5,
                        borderTopRightRadius: 5,
                    },
                    { backgroundColor: color, width: widthInterpolation },
                ]}
            />
        </View>
    );
};