import { Text, TouchableOpacity, View } from 'react-native';
import React, { cloneElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { FontAwesome, FontAwesome5, Ionicons } from '@expo/vector-icons';
import Checkbox from 'expo-checkbox';
import { isWeb } from '@/constants/Constants';
import { useDispatch, useSelector } from 'react-redux';
import { ProfileHelper } from '@/redux/actions/Profile/Profile';
import { UPDATE_PROFILE } from '@/redux/Types/types';
import { useLanguage } from '@/hooks/useLanguage';
import animation from '@/assets/animations/priceGroup.json';
import LottieView from 'lottie-react-native';
import { useFocusEffect } from 'expo-router';
import { replaceLottieColors } from '@/helper/animationHelper';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { CollectibleAt, DatabaseTypes } from 'repo-depkit-common';
import { RootState } from '@/redux/reducer';
import { myContrastColor } from '@/helper/ColorHelper';
import { PriceGroupKey } from '@/app/(app)/settings/types';
import { UserHelper } from '@/helper/UserHelper';
import CollectibleSpot from '@/components/CollectibleItem/CollectibleSpot';

const Index = () => {
	useSetPageTitle(TranslationKeys.price_group);
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const dispatch = useDispatch();
	const profileHelper = new ProfileHelper();
	const [loading, setLoading] = useState(false);
	const { user, profile } = useSelector((state: RootState) => state.authReducer);
	const isRegisteredUser = UserHelper.isRegisteredUser(user);

	const { primaryColor, appSettings, selectedTheme: mode } = useSelector((state: RootState) => state.settings);
	const contrastColor = myContrastColor(primaryColor, theme, mode === 'dark');
	const [autoPlay, setAutoPlay] = useState(appSettings?.animations_auto_start);
	const animationRef = useRef<LottieView>(null);
	const [animationJson, setAmimationJson] = useState<any>(null);
	const [selectedOption, setSelectedOption] = useState<string | null>(null);
	const sortingOptions = [
		{
			id: PriceGroupKey.student,
			label: translate(TranslationKeys.price_group_student),
			icon: <FontAwesome name="graduation-cap" size={24} />,
		},
		{
			id: PriceGroupKey.employee,
			label: translate(TranslationKeys.price_group_employee),
			icon: <Ionicons name="bag" size={24} />,
		},
		{
			id: PriceGroupKey.guest,
			label: translate(TranslationKeys.price_group_guest),
			icon: <FontAwesome5 name="users" size={24} />,
		},
	];

	useFocusEffect(
		useCallback(() => {
			setAmimationJson(replaceLottieColors(animation, primaryColor));
			return () => {
				setAmimationJson(null);
			};
		}, [])
	);

	useFocusEffect(
		useCallback(() => {
			setAutoPlay(appSettings?.animations_auto_start); // Enable when entering

			return () => {
				setAutoPlay(false); // Reset when leaving
				setAmimationJson(null);
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
	const updatePricing = async (option: string) => {
		try {
			setLoading(true);
			setSelectedOption(option);
			const payload = { ...profile, price_group: option };
			if (isRegisteredUser) {
				const result = (await profileHelper.updateProfile(payload)) as DatabaseTypes.Profiles;
				if (result) {
					dispatch({ type: UPDATE_PROFILE, payload });
				}
			} else {
				dispatch({ type: UPDATE_PROFILE, payload });
			}
			setLoading(false);
		} catch (error) {
			console.error('Error updating profile:', error);
			setLoading(false);
		}
	};

	useEffect(() => {
		console.log('Profile changed, updating selected option:', profile);
		setSelectedOption(profile?.price_group || PriceGroupKey.student);
	}, [profile]);

	return (
		<View style={{ ...styles.container, backgroundColor: theme.screen.background }}>
			<View style={styles.gifContainer}>{renderLottie}</View>
			<View style={{ ...styles.priceGroupContainer, width: isWeb ? '80%' : '100%' }}>
				{sortingOptions.map(option => (
					<TouchableOpacity
						key={option.id}
						style={[
							styles.actionItem,
							selectedOption === option.id
								? {
										backgroundColor: primaryColor,
									}
								: {
										backgroundColor: theme.card.background,
									},
						]}
						onPress={() => updatePricing(option.id)}
					>
						<View style={styles.col}>
							{cloneElement(option.icon, selectedOption === option.id ? { color: contrastColor } : { color: theme.screen.icon })}
							<Text
								style={[
									styles.label,
									selectedOption === option.id
										? {
												color: contrastColor,
											}
										: { color: theme.screen.text },
								]}
							>
								{option.label}
							</Text>
						</View>
						<Checkbox
							style={styles.checkbox}
							value={selectedOption === option.id}
							// onValueChange={() => updatePricing(option.id)}
							color={selectedOption === option.id ? '#000000' : undefined}
						/>
					</TouchableOpacity>
                                ))}
                        <CollectibleSpot collectibleKey={CollectibleAt.collectable_at_price_group_selection} />
                        </View>
                </View>
        );
};

export default Index;
