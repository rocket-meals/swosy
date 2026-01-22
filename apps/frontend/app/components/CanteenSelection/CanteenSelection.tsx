import { Dimensions, Text, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DatabaseTypes } from 'repo-depkit-common';
import { useTheme } from '@/hooks/useTheme';
import { canteensData, isWeb } from '@/constants/Constants';
import { excerpt, getImageUrl } from '@/constants/HelperFunctions';
import CardWithText from '../CardWithText/CardWithText';
import styles from '../CanteenSelectionSheet/styles';
import { useAppSelector } from '@/redux/hooks';

interface CanteenSelectionProps {
	onSelectCanteen: (canteen: DatabaseTypes.Canteens) => void;
}

const CanteenSelection: React.FC<CanteenSelectionProps> = ({ onSelectCanteen }) => {
	const { theme } = useTheme();
	const { serverInfo, appSettings, primaryColor } = useAppSelector((state) => state.settings);
	const { canteens, selectedCanteen } = useAppSelector((state) => state.canteenReducer);
	const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

	const defaultImage = getImageUrl(serverInfo?.info?.project?.project_logo);
	const foods_area_color = appSettings?.foods_area_color ? appSettings?.foods_area_color : primaryColor;

	useEffect(() => {
		const handleResize = () => {
			setScreenWidth(Dimensions.get('window').width);
		};

		const subscription = Dimensions.addEventListener('change', handleResize);

		return () => subscription?.remove();
	}, []);

	return (
		<View
			style={{
				...styles.canteensContainer,
				width: '100%',
				gap: isWeb ? (screenWidth < 500 ? 10 : 20) : 5,
				marginTop: isWeb ? 40 : 20,
			}}
		>
			{canteens.map((canteen, index: number) => {
				const isSelected = selectedCanteen && String(selectedCanteen.id) === String(canteen.id);
				const imageUrl = canteen?.image_url || canteensData[index]?.image;
				return (
					<CardWithText
						key={canteen.id + canteen.alias}
						onPress={() => {
							onSelectCanteen(canteen);
						}}
						imageSource={{ uri: imageUrl || defaultImage || '' }}
						containerStyle={{
							width: screenWidth > 800 ? 210 : 160,
							backgroundColor: theme.card.background,
							marginBottom: 10,
							borderColor: isSelected ? foods_area_color : 'transparent',
							borderWidth: isSelected ? 3 : 0,
						}}
						imageContainerStyle={{
							height: screenWidth > 800 ? 210 : 160,
						}}
					>
						{canteen.status === 'archived' && (
							<View style={styles.archiveContainer}>
								<MaterialCommunityIcons name="archive" size={18} color={theme.screen.text} />
							</View>
						)}
						<Text style={{ ...styles.foodName, color: theme.screen.text }} numberOfLines={3} ellipsizeMode="tail">
							{excerpt(String(canteen.alias), 20)}
						</Text>
					</CardWithText>
				);
			})}
		</View>
	);
};

export default CanteenSelection;
