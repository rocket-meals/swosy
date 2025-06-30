import React, { useEffect, useRef } from 'react';
import { FlatList, View, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import styles from './styles';

interface AutoImageScrollerProps {
  images: string[];
  numColumns: number;
  size: number;
  speed: number; // pixels per second
}

const AutoImageScroller: React.FC<AutoImageScrollerProps> = ({
  images,
  numColumns,
  size,
  speed,
}) => {
  const flatListRef = useRef<FlatList<string>>(null);
  const scrollOffset = useRef(0);
  const screenHeight = Dimensions.get('window').height;
  const frameRef = useRef<number>();

  useEffect(() => {
    let lastTime: number | null = null;

    const step = (time: number) => {
      if (lastTime === null) {
        lastTime = time;
      }
      const delta = time - lastTime;
      lastTime = time;
      const distance = (speed * delta) / 1000;
      const maxOffset =
        Math.ceil(images.length / numColumns) * size - screenHeight;
      scrollOffset.current += distance;
      if (scrollOffset.current >= maxOffset) {
        scrollOffset.current = 0;
      }
      flatListRef.current?.scrollToOffset({
        offset: scrollOffset.current,
        animated: false,
      });
      frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [images, numColumns, size, speed, screenHeight]);

  const renderItem = ({ item, index }: { item: string; index: number }) => {
    const columnIndex = index % numColumns;
    const offset = (columnIndex % 3) * (size / 3);
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
  );
};

export default AutoImageScroller;
