import { Dimensions, ScrollView, Text, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import StatisticsCard from '@/components/StatisticsCard/StatisticsCard';
import { loadMostLikedOrDislikedFoods } from '@/helper/FoodHelper';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '@/redux/hooks';
import { SET_MOST_DISLIKED_FOODS, SET_MOST_LIKED_FOODS } from '@/redux/Types/types';
import { DatabaseTypes } from 'repo-depkit-common';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import ImageManagementSheet from '@/components/ImageManagementSheet/ImageManagementSheet';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { TranslationKeys } from '@/locales/keys';

const Index = () => {
	useSetPageTitle(TranslationKeys.statistiken);
	const { theme } = useTheme();
	const dispatch = useDispatch();
	const { show: showScrollViewModal, close: closeScrollViewModal } = useMyScrollViewModal();
	const [selectedFoodId, setSelectedFoodId] = useState('');

	const { mostLikedFoods, mostDislikedFoods } = useAppSelector((state) => state.food);
	const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

	const openImageManagementSheet = () => {
		showScrollViewModal({
			children: <ImageManagementSheet closeSheet={closeScrollViewModal} selectedFoodId={selectedFoodId} handleFetch={fetchFoods} fileName="foods" />,
		});
	};

	const fetchMostLikedFoods = async () => {
		const mostLikedFoods = await loadMostLikedOrDislikedFoods(10, 0, undefined, true);
		if (mostLikedFoods) {
			dispatch({ type: SET_MOST_LIKED_FOODS, payload: mostLikedFoods });
		}
	};

	const fetchMostDisLikedFoods = async () => {
		const mostDisLikedFoods = await loadMostLikedOrDislikedFoods(10, 0, undefined, false);
		if (mostDisLikedFoods) {
			dispatch({ type: SET_MOST_DISLIKED_FOODS, payload: mostDisLikedFoods });
		}
	};

	const fetchFoods = () => {
		fetchMostLikedFoods();
		fetchMostDisLikedFoods();
	};

	useEffect(() => {
		fetchFoods();
	}, []);

	useEffect(() => {
		const handleResize = () => {
			setScreenWidth(Dimensions.get('window').width);
		};

		const subscription = Dimensions.addEventListener('change', handleResize);

		return () => subscription?.remove();
	}, []);

	return (
		<View style={{ ...styles.container, backgroundColor: theme.screen.background }}>
			<View
				style={{
					...styles.statisticsContainer,
					padding: screenWidth > 600 ? 20 : 5,
					gap: screenWidth > 600 ? 20 : 10,
				}}
			>
				<View style={styles.topContainer}>
					<Text style={{ ...styles.heading, color: theme.screen.text }}>Top 10</Text>
					<ScrollView>{mostLikedFoods && mostLikedFoods?.map((item: DatabaseTypes.Foods) => <StatisticsCard key={item.id} food={item} handleImageSheet={openImageManagementSheet} setSelectedFoodId={setSelectedFoodId} />)}</ScrollView>
				</View>

				<View style={styles.worstContainer}>
					<Text style={{ ...styles.heading, color: theme.screen.text }}>Worst 10</Text>
					<ScrollView>{mostDislikedFoods && mostDislikedFoods?.map((item: DatabaseTypes.Foods) => <StatisticsCard key={item.id} food={item} handleImageSheet={openImageManagementSheet} setSelectedFoodId={setSelectedFoodId} />)}</ScrollView>
				</View>
			</View>
		</View>
	);
};

export default Index;
