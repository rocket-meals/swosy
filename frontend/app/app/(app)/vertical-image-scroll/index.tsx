import { ScrollView, View, Dimensions } from 'react-native';
import React, { useEffect, useState } from 'react';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { Image } from 'expo-image';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducer';

const images = Array.from({ length: 5 }).map((_, index) => ({
  uri: `https://placehold.co/600x400.png?text=Image+${index + 1}`,
}));

const VerticalImageScroll = () => {
  useSetPageTitle(TranslationKeys.vertical_image_scroll);
  const { theme } = useTheme();
  const { amountColumnsForcard } = useSelector(
    (state: RootState) => state.settings
  );
  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get('window').width
  );

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => sub?.remove();
  }, []);

  const getCardDimension = () => {
    if (screenWidth < 1110 && screenWidth > 960) return 300;
    else if (screenWidth < 840 && screenWidth > 750) return 350;
    else if (screenWidth < 750 && screenWidth > 710) return 330;
    else if (screenWidth < 709 && screenWidth > 650) return 300;
    else if (screenWidth > 570) return 260;
    else if (screenWidth > 530) return 240;
    else if (screenWidth > 500) return 220;
    else if (screenWidth > 450) return 210;
    else if (screenWidth > 380) return 180;
    else if (screenWidth > 360) return 170;
    else if (screenWidth > 340) return 160;
    else if (screenWidth > 320) return 150;
    else if (screenWidth > 300) return 140;
    else if (screenWidth > 280) return 130;
    else return 120;
  };

  const getCardWidth = () => {
    const offset = screenWidth < 500 ? 10 : screenWidth < 900 ? 25 : 35;
    return screenWidth / amountColumnsForcard - offset;
  };

  const size =
    amountColumnsForcard === 0 ? getCardDimension() : getCardWidth();

  return (
    <ScrollView
      style={{ ...styles.container, backgroundColor: theme.screen.background }}
    >
      <View style={styles.grid}>
        {images.map((img, index) => (
          <Image
            key={index}
            source={img}
            style={[
              styles.image,
              {
                width: size,
                height: size,
                marginTop: index % 2 === 0 ? 0 : 20,
              },
            ]}
            contentFit='cover'
          />
        ))}
      </View>
    </ScrollView>
  );
};

export default VerticalImageScroll;
