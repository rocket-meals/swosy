import React, { memo } from 'react';
import { View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import styles from '../styles';

interface DetailsImageProps {
    imageSource: any;
    screenWidth: number;
}

const DetailsImage: React.FC<DetailsImageProps> = ({ imageSource, screenWidth }) => {
    let size: number;
    if (screenWidth > 1000) {
        size = 400;
    } else if (screenWidth > 900) {
        size = 350;
    } else {
        size = screenWidth - 20;
    }

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
