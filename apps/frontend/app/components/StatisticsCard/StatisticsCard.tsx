import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import MyImage from '@/components/MyImage';
import React, { useEffect, useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import styles from './styles';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatisticsCardProps } from './types';
import { getImageUrl } from '@/constants/HelperFunctions';
import { useAppSelector } from '@/redux/hooks';

const StatisticsCard: React.FC<StatisticsCardProps> = ({ food, handleImageSheet, setSelectedFoodId }) => {
	const { theme } = useTheme();
	const { serverInfo, appSettings } = useAppSelector((state) => state.settings);
	const defaultImage = getImageUrl(String(appSettings.foods_placeholder_image)) || appSettings.foods_placeholder_image_remote_url || getImageUrl(serverInfo?.info?.project?.project_logo);
	const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

	useEffect(() => {
		const handleResize = () => {
			setScreenWidth(Dimensions.get('window').width);
		};

		const subscription = Dimensions.addEventListener('change', handleResize);

		return () => subscription?.remove();
	}, []);

	const isWide = screenWidth > 950;
	const flexDirection = isWide ? 'row' : 'column';
	const cardHeight = isWide ? 180 : 190;
	const imageSize = isWide ? 178 : 90;
	const contentPadding = isWide ? 15 : 5;
	const contentMarginTop = isWide ? 0 : 10;
	const rowMarginBottom = isWide ? 20 : 10;
	const colGap = isWide ? 10 : 5;
	const iconSize = isWide ? 24 : 20;
	const fontSize = isWide ? 18 : 12;

	return (
		<View
			style={{
				...styles.container,
				borderColor: theme.screen.icon,
				flexDirection,
				height: cardHeight,
			}}
		>
			<View
				style={{
					...styles.imageContainer,
					width: imageSize,
					height: imageSize,
				}}
			>
				<MyImage
					style={styles.image}
					remote_image_url={food?.image_remote_url}
					directus_asset_id={food?.image}
					defaultImageUrl={defaultImage}
					accessibilityLabel={food?.alias ?? ''}
				/>
				<TouchableOpacity
					style={styles.uploadImage}
					onPress={() => {
						setSelectedFoodId(food?.id);
						handleImageSheet();
					}}
				>
					<MaterialCommunityIcons name="image-edit" size={20} color={'white'} />
				</TouchableOpacity>
			</View>
			<View
				style={{
					...styles.ratingContainer,
					padding: contentPadding,
					marginTop: contentMarginTop,
				}}
			>
				<View style={{ ...styles.row, marginBottom: rowMarginBottom }}>
					<View style={{ ...styles.col, gap: colGap }}>
						<MaterialCommunityIcons name="chart-bar" color={theme.screen.icon} size={iconSize} />
						<Text
							style={{
								...styles.label,
								color: theme.screen.text,
								fontSize,
							}}
						>
							Number of Ratings
						</Text>
					</View>
					<Text
						style={{
							...styles.value,
							color: theme.screen.text,
							fontSize,
						}}
					>
						{food?.rating_amount}
					</Text>
				</View>
				<View style={{ ...styles.row, marginBottom: rowMarginBottom }}>
					<View style={{ ...styles.col, gap: colGap }}>
						<MaterialCommunityIcons name="chart-areaspline" color={theme.screen.icon} size={iconSize} />
						<Text
							style={{
								...styles.label,
								color: theme.screen.text,
								fontSize,
							}}
						>
							Average Rating
						</Text>
					</View>
					<Text
						style={{
							...styles.value,
							color: theme.screen.text,
							fontSize,
						}}
					>
						{food?.rating_average?.toFixed(2)}
					</Text>
				</View>
			</View>
		</View>
	);
};

export default StatisticsCard;
