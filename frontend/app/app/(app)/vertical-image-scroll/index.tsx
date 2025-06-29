import { FlatList, View, Dimensions } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { Image } from 'expo-image';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducer';

const IMAGE_BATCH = 15;

const generateImages = (count: number) =>
  Array.from({ length: count }).map(
    () =>
      `https://source.unsplash.com/random/600x600/?food&sig=${Math.random()}`
  );

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

  const [images, setImages] = useState<string[]>([]);
  const flatListRef = useRef<FlatList<string>>(null);
  const scrollOffset = useRef(0);

  useEffect(() => {
    setImages(generateImages(IMAGE_BATCH));
  }, []);

  const loadMore = () => {
    setImages((prev) => [...prev, ...generateImages(IMAGE_BATCH)]);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      scrollOffset.current += 1;
      flatListRef.current?.scrollToOffset({
        offset: scrollOffset.current,
        animated: false,
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const renderItem = ({ item, index }: { item: string; index: number }) => {
    const rowIndex = Math.floor(index / amountColumnsForcard);
    const offset = ((rowIndex + 1) % 3) * (size / 3);
    return (
      <View style={{ transform: [{ translateY: offset }] }}>
        <Image
          source={{ uri: item }}
          style={[styles.image, { width: size, height: size }]}
          contentFit='cover'
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.screen.background }]}>
      <FlatList
        ref={flatListRef}
        data={images}
        renderItem={renderItem}
        keyExtractor={(_, idx) => idx.toString()}
        numColumns={amountColumnsForcard || 1}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
    </View>
  );
};

export default VerticalImageScroll;
