import { ScrollView } from 'react-native';
import React from 'react';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { Image } from 'expo-image';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';

const images = Array.from({ length: 5 }).map((_, index) => ({
  uri: `https://placehold.co/600x400.png?text=Image+${index + 1}`,
}));

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
