import { View, InteractionManager } from 'react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { isWeb } from '@/constants/Constants';
import { useAppSelector } from '@/redux/hooks';
import animation from '@/assets/animations/priceGroup.json';
import LottieView from 'lottie-react-native';
import { useFocusEffect } from 'expo-router';
import { replaceLottieColors } from '@/helper/animationHelper';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { CollectibleAt } from 'repo-depkit-common';
import CollectibleSpot from '@/components/CollectibleItem/CollectibleSpot';
import PriceGroupSettingsList from '@/components/PriceGroupSettingsList';

// Module-level cache so the expensive color-replacement deep-copy only runs once
// per primaryColor value across all navigations, even when the screen is unmounted.
let _cachedAnimationJson: any = null;
let _cachedPrimaryColor: string | null = null;

const Index = () => {
	useSetPageTitle(TranslationKeys.price_group);
	const { theme } = useTheme();

	const { primaryColor, appSettings } = useAppSelector((state) => state.settings);
	const [autoPlay, setAutoPlay] = useState(appSettings?.animations_auto_start);
	const animationRef = useRef<LottieView>(null);
	const [animationJson, setAmimationJson] = useState<any>(null);

	useFocusEffect(
		useCallback(() => {
			// Cache hit: set the processed animation immediately without blocking.
			if (_cachedAnimationJson && _cachedPrimaryColor === primaryColor) {
				setAmimationJson(_cachedAnimationJson);
				return;
			}

			// Cache miss: defer the expensive deep-copy + color-replacement until after
			// the navigation animation so it never blocks the transition.
			const task = InteractionManager.runAfterInteractions(() => {
				_cachedAnimationJson = replaceLottieColors(animation, primaryColor);
				_cachedPrimaryColor = primaryColor;
				setAmimationJson(_cachedAnimationJson);
			});
			return () => {
				task.cancel();
			};
		}, [primaryColor])
	);

	useFocusEffect(
		useCallback(() => {
			setAutoPlay(appSettings?.animations_auto_start); // Enable when entering

			return () => {
				setAutoPlay(false); // Reset when leaving
			};
		}, [appSettings?.animations_auto_start])
	);

	useEffect(() => {
		if (animationJson && autoPlay && animationRef.current) {
			animationRef?.current?.play(); // Reset animation to ensure it starts fresh
		}
	}, [animationJson, autoPlay]);

	const renderLottie = useMemo(() => {
		if (animationJson) {
			// @ts-expect-error LottieView type issue - LottieView has autoPlay prop but types don't reflect it
			return <LottieView ref={animationRef} source={animationJson} resizeMode="contain" style={{ width: '100%', height: '100%' }} autoPlay={autoPlay} loop={false} />;
		}
	}, [autoPlay, animationJson]);

	return (
		<View style={{ ...styles.container, backgroundColor: theme.screen.background }}>
			<View style={styles.gifContainer}>{renderLottie}</View>
			<View style={{ ...styles.priceGroupContainer, width: isWeb ? '80%' : '100%' }}>
				<PriceGroupSettingsList />
				<CollectibleSpot collectibleKey={CollectibleAt.collectible_at_price_group_selection} />
			</View>
		</View>
	);
};

export default Index;
