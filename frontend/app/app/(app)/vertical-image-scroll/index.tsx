import { ScrollView } from 'react-native';
import React from 'react';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { Image } from 'expo-image';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';

const images = [
  require('@/assets/images/react-logo.png'),
  require('@/assets/images/react-logo@2x.png'),
  require('@/assets/images/react-logo@3x.png'),
  require('@/assets/images/splash.png'),
  require('@/assets/images/splash-icon.png'),
];

const VerticalImageScroll = () => {
  useSetPageTitle(TranslationKeys.vertical_image_scroll);
  const { theme } = useTheme();

  return (
    <ScrollView style={{ ...styles.container, backgroundColor: theme.screen.background }}>
      {images.map((img, index) => (
        <Image
          key={index}
          source={img}
          style={styles.image}
          contentFit='contain'
        />
      ))}
    </ScrollView>
  );
};

export default VerticalImageScroll;
