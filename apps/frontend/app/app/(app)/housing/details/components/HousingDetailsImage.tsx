import React, { memo, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { DatabaseTypes } from 'repo-depkit-common';
import { getImageUrl } from '@/constants/HelperFunctions';
import MyImage from '@/components/MyImage';
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
	const remoteUrl = (apartmentDetails as any)?.image_remote_url;
	const imageId = (apartmentDetails as any)?.image;


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
			<MyImage
				remote_image_url={remoteUrl}
				directus_asset_id={imageId}
				defaultImage={{ uri: defaultImage }}
				contentFit="cover"
				style={styles.image}
			/>
		</View>
	);
};

export default memo(HousingDetailsImage);
