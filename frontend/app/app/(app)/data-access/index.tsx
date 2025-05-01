import React, { useRef, useState, useCallback, useMemo } from 'react';
import { Platform, View } from 'react-native';
import DataAcess from '../../../components/DataAcces/DataAccess';
import DataSheet from '../../../components/DataAccesheet/DataSheet';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useFocusEffect } from 'expo-router';
import { useLanguage } from '@/hooks/useLanguage';

const index = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['90%'], []);
  const [isActive, setIsActive] = useState(false);
  const [content, setContent] = useState([]);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'web') {
        const title = t('dataAccess');
        document.title = title;
      }
    }, [])
  );

  const handleOpenBottomSheet = useCallback((data: any) => {
    setContent(data);
    bottomSheetRef?.current?.expand();
  }, []);

  const closeCanteenSheet = useCallback(() => {
    bottomSheetRef?.current?.close();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsActive(true);
      return () => {
        setIsActive(false);
      };
    }, [])
  );

  return (
    <View style={styles.container}>
      <DataAcess onOpenBottomSheet={handleOpenBottomSheet} />
      {isActive && (
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          backgroundStyle={{
            ...styles.sheetBackground,
            backgroundColor: theme.sheet.sheetBg,
          }}
          enablePanDownToClose
          handleComponent={null}
          backdropComponent={(props) => <BottomSheetBackdrop {...props} />}
        >
          <DataSheet closeSheet={closeCanteenSheet} content={content} />
        </BottomSheet>
      )}
    </View>
  );
};

export default index;
