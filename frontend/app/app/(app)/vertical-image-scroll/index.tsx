import { FlatList, View, Text, Dimensions } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { Image } from 'expo-image';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducer';
import CardDimensionHelper from '@/helper/CardDimensionHelper';

// Placeholder images which will be replaced with food images in the future
const PLACEHOLDER_IMAGE_URLS = Array.from({ length: 20 }).map(
  (_, i) => `https://picsum.photos/id/${i + 10}/600/600`
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

  const numColumns = CardDimensionHelper.getNumColumns(
    screenWidth,
    amountColumnsForcard
  );

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => sub?.remove();
  }, []);

  const size =
    amountColumnsForcard === 0
      ? CardDimensionHelper.getCardDimension(screenWidth)
      : CardDimensionHelper.getCardWidth(screenWidth, numColumns);

  const [images, setImages] = useState<string[]>([]);
  const flatListRef = useRef<FlatList<string>>(null);
  const scrollOffset = useRef(0);
  const screenHeight = Dimensions.get('window').height;

  useEffect(() => {
    // In future this will load real food image URLs instead of placeholders
    setImages(PLACEHOLDER_IMAGE_URLS);
  }, []);


  useEffect(() => {
    const interval = setInterval(() => {
      const maxOffset =
        Math.ceil(images.length / numColumns) * size - screenHeight;
      if (scrollOffset.current >= maxOffset) {
        scrollOffset.current = 0;
      } else {
        scrollOffset.current += 1;
      }
      flatListRef.current?.scrollToOffset({
        offset: scrollOffset.current,
        animated: false,
      });
    }, 50);
    return () => clearInterval(interval);
  }, [images, numColumns, size, screenHeight]);

  const renderItem = ({ item, index }: { item: string; index: number }) => {
    const columnIndex = index % numColumns;
    const offset = (columnIndex % 3) * (size / 3);
    return (
      <View style={{ transform: [{ translateY: offset }] }}>
        <Image
          source={{ uri: item }}
          style={[
            styles.image,
            {
              width: size,
              height: size,
            },
          ]}
          contentFit='cover'
        />
      </View>
    );
  };

  return (
    <View
      key={amountColumnsForcard}
      style={[styles.container, { backgroundColor: theme.screen.background }]}
    >
      <Text style={{ textAlign: 'center', marginVertical: 8, color: theme.primary }}>
        {numColumns} images per row | {Math.round(size)}x{Math.round(size)}px
      </Text>
      <FlatList
        ref={flatListRef}
        key={numColumns}
        data={images}
        renderItem={renderItem}
        keyExtractor={(_, idx) => idx.toString()}
        numColumns={numColumns}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
    </View>
  );
};

export default VerticalImageScroll;
