import React, { memo } from 'react';
import { View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import styles from '../styles';

interface DetailsImageProps {
    imageSource: any;
    screenWidth: number;
}

const DetailsImage: React.FC<DetailsImageProps> = ({ imageSource, screenWidth }) => {
    const size = screenWidth > 1000 ? 400 : screenWidth > 900 ? 350 : screenWidth - 20;

    return (
        <View
            style={[
                styles.imageContainer,
                {
                    width: size,
                    height: size,
                }
            ]}
        >
            <ExpoImage
                source={imageSource}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={250}
                style={styles.image}
            />
        </View>
    );
};

export default memo(DetailsImage);
