import { ScrollView, Text, View } from 'react-native';
import React from 'react';
import styles from '../styles';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/redux/hooks';
import { Entypo, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import SettingsList from '@/components/SettingsList';

const EatingHabitsPerformanceIndex = () => {
	useSetPageTitle(TranslationKeys.eating_habits_performance);
	const { translate } = useLanguage();
	const { theme } = useTheme();
	const { primaryColor } = useAppSelector((state) => state.settings);

	const listItems = [
		{
			key: 'full',
			label: translate(TranslationKeys.eating_habits_performance_full),
			leftIcon: <MaterialCommunityIcons name="bug-outline" size={24} color={theme.screen.icon} />,
			onPress: () => router.push('/experimentell/eating-habits-performance/full'),
		},
		{
			key: 'no-lottie',
			label: translate(TranslationKeys.eating_habits_performance_no_lottie),
			leftIcon: <MaterialCommunityIcons name="animation-play-outline" size={24} color={theme.screen.icon} />,
			onPress: () => router.push('/experimentell/eating-habits-performance/no-lottie'),
		},
		{
			key: 'no-defer',
			label: translate(TranslationKeys.eating_habits_performance_no_defer),
			leftIcon: <MaterialCommunityIcons name="timer-off-outline" size={24} color={theme.screen.icon} />,
			onPress: () => router.push('/experimentell/eating-habits-performance/no-defer'),
		},
		{
			key: 'plain-text',
			label: translate(TranslationKeys.eating_habits_performance_plain_text),
			leftIcon: <MaterialCommunityIcons name="text-box-outline" size={24} color={theme.screen.icon} />,
			onPress: () => router.push('/experimentell/eating-habits-performance/plain-text'),
		},
		{
			key: 'plain-text-image',
			label: translate(TranslationKeys.eating_habits_performance_plain_text_image),
			leftIcon: <MaterialCommunityIcons name="image-text" size={24} color={theme.screen.icon} />,
			onPress: () => router.push('/experimentell/eating-habits-performance/plain-text-image'),
		},
		{
			key: 'plain-each-component',
			label: translate(TranslationKeys.eating_habits_performance_plain_each_component),
			leftIcon: <MaterialCommunityIcons name="view-list-outline" size={24} color={theme.screen.icon} />,
			onPress: () => router.push('/experimentell/eating-habits-performance/plain-each-component'),
		},
		{
			key: 'plain-component-with-image',
			label: translate(TranslationKeys.eating_habits_performance_plain_component_with_image),
			leftIcon: <MaterialCommunityIcons name="card-outline" size={24} color={theme.screen.icon} />,
			onPress: () => router.push('/experimentell/eating-habits-performance/plain-component-with-image'),
		},
		{
			key: 'plain-component-full',
			label: translate(TranslationKeys.eating_habits_performance_plain_component_full),
			leftIcon: <MaterialCommunityIcons name="format-list-bulleted" size={24} color={theme.screen.icon} />,
			onPress: () => router.push('/experimentell/eating-habits-performance/plain-component-full'),
		},
	];

	return (
		<ScrollView
			style={{ ...styles.container, backgroundColor: theme.screen.background }}
			contentContainerStyle={{
				...styles.contentContainer,
				backgroundColor: theme.screen.background,
			}}
		>
			<View style={{ ...styles.content }}>
				<Text style={{ ...styles.heading, color: theme.screen.text }}>
					{translate(TranslationKeys.eating_habits_performance)}
				</Text>
				{listItems.map((item, index) => {
					const totalItems = listItems.length;
					const groupPosition =
						totalItems === 1 ? 'single' : index === 0 ? 'top' : index === totalItems - 1 ? 'bottom' : 'middle';
					return (
						<SettingsList
							key={item.key}
							iconBgColor={primaryColor}
							leftIcon={item.leftIcon}
							label={item.label}
							rightIcon={<Entypo name="chevron-small-right" color={theme.screen.icon} size={24} />}
							handleFunction={item.onPress}
							groupPosition={groupPosition}
						/>
					);
				})}
			</View>
		</ScrollView>
	);
};

export default EatingHabitsPerformanceIndex;
