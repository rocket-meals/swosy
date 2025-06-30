import {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducer';
import CardDimensionHelper from '@/helper/CardDimensionHelper';
import AutoImageScroller from '@/components/AutoImageScroller';
import { Ionicons } from '@expo/vector-icons';

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

  useEffect(() => {
    // In future this will load real food image URLs instead of placeholders
    setImages(PLACEHOLDER_IMAGE_URLS);
  }, []);


  // percentage of screen height per second
  const [speedPercent, setSpeedPercent] = useState(5);

  return (
    <View
      key={amountColumnsForcard}
      style={[styles.container, { backgroundColor: theme.screen.background }]}
    >
      <View style={styles.controls}>
        <TouchableOpacity
          onPress={() => setSpeedPercent((s) => Math.max(1, s - 1))}
        >
          <Ionicons name='remove' size={24} color={theme.primary} />
        </TouchableOpacity>
        <Text style={{ color: theme.primary }}>{Math.round(speedPercent)}%/s</Text>
        <TouchableOpacity onPress={() => setSpeedPercent((s) => s + 1)}>
          <Ionicons name='add' size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>
      <AutoImageScroller
        images={images}
        numColumns={numColumns}
        size={size}
        speedPercent={speedPercent}
      />
    </View>
  );
};

export default VerticalImageScroll;
