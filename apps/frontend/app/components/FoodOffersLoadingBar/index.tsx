import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface FoodOffersLoadingBarProps {
    color: string;
    loading: boolean;
    isOffline: boolean;
    textColor: string;
}

const BAR_HEIGHT = 3;
const OFFLINE_ROW_HEIGHT = 20;
const ANIMATION_DURATION = 1200;

const FoodOffersLoadingBar: React.FC<FoodOffersLoadingBarProps> = ({ color, loading, isOffline, textColor }) => {
    const translateX = useRef(new Animated.Value(-1)).current;
    const animationRef = useRef<Animated.CompositeAnimation | null>(null);
    const { width: screenWidth } = useWindowDimensions();

    useEffect(() => {
        if (loading) {
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
    }, [loading, translateX]);

    const accessibilityLabel = loading
        ? 'Lädt Daten und zeigt gespeicherte Angebote'
        : 'Aktuelle Angebote';

    return (
        <View
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="progressbar"
            accessibilityState={{ busy: loading }}
        >
            <View style={styles.barContainer}>
                {loading && (
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
                )}
            </View>
            {isOffline && (
                <View style={styles.offlineRow} accessibilityLabel="Offline" accessibilityRole="text">
                    <MaterialCommunityIcons name="cloud-off-outline" size={14} color={textColor} style={styles.offlineIcon} accessibilityElementsHidden />
                    <Text style={[styles.offlineText, { color: textColor }]} accessibilityElementsHidden>Offline</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    barContainer: {
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
    offlineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: OFFLINE_ROW_HEIGHT,
    },
    offlineIcon: {
        marginRight: 4,
        opacity: 0.6,
    },
    offlineText: {
        fontSize: 12,
        opacity: 0.6,
    },
});

export default React.memo(FoodOffersLoadingBar);
