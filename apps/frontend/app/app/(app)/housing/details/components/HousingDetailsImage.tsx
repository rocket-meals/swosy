import React, { memo, useMemo } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { DatabaseTypes } from 'repo-depkit-common';
import { getImageUrl } from '@/constants/HelperFunctions';
import styles from '../styles';

interface HousingDetailsImageProps {
	apartmentDetails: DatabaseTypes.Apartments | null;
	screenWidth: number;
	defaultImage: string;
}

const HousingDetailsImage: React.FC<HousingDetailsImageProps> = ({
	apartmentDetails,
	screenWidth,
	defaultImage,
}) => {
	const imageSource = useMemo(() => {
		const remoteUrl = (apartmentDetails as any)?.image_remote_url;
		const imageId = (apartmentDetails as any)?.image;

		if (remoteUrl) {
			return { uri: remoteUrl };
		}
		if (imageId) {
			return { uri: getImageUrl(String(imageId)) };
		}
		return { uri: defaultImage };
	}, [apartmentDetails, defaultImage]);

	const containerStyle = useMemo(() => {
		let size = screenWidth - 20; // Default for small screens
		if (screenWidth > 1000) {
			size = 400;
		} else if (screenWidth > 900) {
			size = 350;
		}
		
		return {
			width: size,
			height: size,
		};
	}, [screenWidth]);

	return (
		<View style={[styles.imageContainer, containerStyle]}>
			<Image source={imageSource} style={styles.image} resizeMode="cover" />
		</View>
	);
};

export default memo(HousingDetailsImage);
