import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, useWindowDimensions, View } from 'react-native';

interface FoodOffersLoadingBarProps {
    color: string;
    visible: boolean;
}

const BAR_HEIGHT = 3;
const ANIMATION_DURATION = 1200;

const FoodOffersLoadingBar: React.FC<FoodOffersLoadingBarProps> = ({ color, visible }) => {
    const translateX = useRef(new Animated.Value(-1)).current;
    const animationRef = useRef<Animated.CompositeAnimation | null>(null);
    const { width: screenWidth } = useWindowDimensions();

    useEffect(() => {
        if (visible) {
            translateX.setValue(-1);
            const animation = Animated.loop(
                Animated.timing(translateX, {
                    toValue: 1,
                    duration: ANIMATION_DURATION,
                    useNativeDriver: true,
                }),
            );
            animationRef.current = animation;
            animation.start();
        } else {
            animationRef.current?.stop();
            translateX.setValue(-1);
        }

        return () => {
            animationRef.current?.stop();
        };
    }, [visible, translateX]);

    if (!visible) return null;

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.bar,
                    {
                        backgroundColor: color,
                        transform: [
                            {
                                translateX: translateX.interpolate({
                                    inputRange: [-1, 1],
                                    outputRange: [-screenWidth * 0.4, screenWidth],
                                }),
                            },
                        ],
                    },
                ]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: BAR_HEIGHT,
        backgroundColor: 'transparent',
        overflow: 'hidden',
    },
    bar: {
        width: '40%',
        height: '100%',
        borderRadius: BAR_HEIGHT / 2,
        opacity: 0.7,
    },
});

export default React.memo(FoodOffersLoadingBar);
