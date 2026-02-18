import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import React, { memo, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { isWeb } from '@/constants/Constants';
import { excerpt, getImageUrl } from '@/constants/HelperFunctions';
import { router } from 'expo-router';
import { getDistanceUnit } from '@/helper/distanceHelper';
import { BuildingItemProps } from './types';
import styles from './styles';
import { myContrastColor } from '@/helper/ColorHelper';
import { Tooltip, TooltipContent, TooltipText } from '@gluestack-ui/themed';
import { TranslationKeys } from '@/locales/keys';
import CardWithText from '../CardWithText/CardWithText';
import CardDimensionHelper from '@/helper/CardDimensionHelper';
import AvailableFromModal from '../AvailableFromModal';
import useMyScrollviewModalDistanceInformation from '@/hooks/useMyScrollviewModalDistanceInformation';

const ApartmentItem: React.FC<BuildingItemProps> = ({
	apartment,
	onEditImage,
	openDistanceSheet,
	knownCardWidth,
	housingAreaColor,
	defaultImage,
	theme,
	translate,
	isManagement,
	mode
}) => {
	const { openDistanceInformationModal } = useMyScrollviewModalDistanceInformation();
	const [showFreeModal, setShowFreeModal] = useState(false);

	const contrastColor = myContrastColor(housingAreaColor || theme.primary, theme, mode === 'dark');

	const handleNavigation = (id: string) => {
		router.push({
			pathname: '/(app)/housing/details',
			params: { id },
		});
	};

	const cardSize = knownCardWidth || 200;

	return (
		<>
			<CardWithText
				{...{}}
				onPress={() => handleNavigation(apartment?.id)}
				imageSource={
					apartment?.image || apartment?.image_remote_url
						? {
							uri: apartment?.image_remote_url || getImageUrl(apartment?.image),
						}
						: { uri: defaultImage }
				}
				containerStyle={{
					...styles.card,
					width: '100%',
					backgroundColor: theme.card.background,
					flex: 1,
				}}
				aspectRatio={false}
				imageContainerStyle={{
					...styles.imageContainer,
					height: cardSize,
				}}
				contentStyle={{
					...styles.cardContent,
					paddingHorizontal: 5,
					flex: 1,
					justifyContent: 'center'
				}}
				borderColor={housingAreaColor}
				knownCardWidth={knownCardWidth}
				imageChildren={
					<>
						{apartment?.available_from && (
							<TouchableOpacity
								style={{
									...styles.freeBadge,
									backgroundColor: housingAreaColor,
								}}
								onPress={() => setShowFreeModal(true)}
							>
								<MaterialCommunityIcons name="door-open" size={20} color={contrastColor} />
								<Text style={{ ...styles.freeBadgeText, color: contrastColor }}>{translate(TranslationKeys.free_rooms)}</Text>
							</TouchableOpacity>
						)}
						{isManagement && (
							<TouchableOpacity
								style={styles.editImageButton}
								onPress={() => {
									onEditImage?.(apartment);
								}}
							>
								<MaterialCommunityIcons name="image-edit" size={20} color="white" />
							</TouchableOpacity>
						)}
						<View style={styles.distanceActions}>
							<TouchableOpacity
								style={{
									...styles.directionButton,
									backgroundColor: housingAreaColor,
								}}
								onPress={openDistanceInformationModal}
								onLongPress={openDistanceSheet}
							>
								<MaterialCommunityIcons name="map-marker-distance" size={20} color={contrastColor} />
								<Text style={{ ...styles.distance, color: contrastColor }}>{getDistanceUnit(apartment?.distance)}</Text>
							</TouchableOpacity>
						</View>
					</>
				}
			>
				<Text style={{ ...styles.campusName, color: theme.screen.text }}>{isWeb ? excerpt(apartment?.alias, 70) : excerpt(apartment?.alias, 40)}</Text>
			</CardWithText>
			<AvailableFromModal visible={showFreeModal} onClose={() => setShowFreeModal(false)} availableFrom={String(apartment?.available_from)} />
		</>
	);
};

const arePropsEqual = (prevProps: BuildingItemProps, nextProps: BuildingItemProps) => {
	return (
		prevProps.apartment?.id === nextProps.apartment?.id &&
		prevProps.apartment?.distance === nextProps.apartment?.distance &&
		prevProps.apartment?.alias === nextProps.apartment?.alias &&
		prevProps.apartment?.available_from === nextProps.apartment?.available_from &&
		prevProps.apartment?.image === nextProps.apartment?.image &&
		prevProps.housingAreaColor === nextProps.housingAreaColor &&
		prevProps.knownCardWidth === nextProps.knownCardWidth &&
		prevProps.theme === nextProps.theme &&
		prevProps.isManagement === nextProps.isManagement &&
		prevProps.mode === nextProps.mode
	);
};

export default memo(ApartmentItem, arePropsEqual);
