import React, { useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import styles from './styles';
import { useDispatch, useSelector } from 'react-redux';
import { getTextFromTranslation } from '@/helper/resourceHelper';
import { useMyContrastColor } from '@/helper/colorHelper';
import { useTheme } from '@/hooks/useTheme';
import LabelHeader from '@/components/LabelHeader/LabelHeader';
import MarkingIcon from '@/components/MarkingIcon';
import MarkingBottomSheet from '@/components/MarkingBottomSheet';
import type BottomSheet from '@gorhom/bottom-sheet';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { useLanguage } from '@/hooks/useLanguage';
import { SET_MARKING_DETAILS } from '@/redux/Types/types';
import { RootState } from '@/redux/reducer';

const index = () => {
  const { theme } = useTheme();
  const { translate } = useLanguage();
  const dispatch = useDispatch();
  const menuSheetRef = useRef<BottomSheet>(null);

  useSetPageTitle(TranslationKeys.markings);

  const openMenuSheet = () => {
    menuSheetRef.current?.expand();
  };

  const closeMenuSheet = () => {
    menuSheetRef.current?.close();
  };

  const { markings } = useSelector((state: RootState) => state.food);
  const { language, selectedTheme: mode } = useSelector(
    (state: RootState) => state.settings
  );

  const chunkedMarkings = [];
  for (let i = 0; i < markings?.length; i += 7) {
    chunkedMarkings.push(markings?.slice(i, i + 7));
  }

  return (
    <ScrollView
      contentContainerStyle={{
        ...styles.container,
        backgroundColor: theme.screen.background,
      }}
    >
      <LabelHeader Label={translate(TranslationKeys.markings)} />

      <View style={styles.gridContainer}>
        {chunkedMarkings &&
          chunkedMarkings?.map((chunk, chunkIndex) => (
            <View key={chunkIndex} style={styles.mainContainer}>
              {chunk.map((marking, index) => {
                const markingText = getTextFromTranslation(
                  marking?.translations,
                  language
                );
                const MarkingBackgroundColor = marking?.background_color;
                const MarkingColor = useMyContrastColor(
                  marking?.background_color,
                  theme,
                  mode === 'dark'
                );
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.iconText}
                    onPress={() => {
                      dispatch({ type: SET_MARKING_DETAILS, payload: marking });
                      openMenuSheet();
                    }}
                  >
                    <MarkingIcon
                      marking={{
                        icon: marking?.icon,
                        short_code: marking?.short_code,
                        image: marking?.image,
                        image_remote_url: marking?.image_remote_url,
                        background_color: marking?.background_color,
                        hide_border: marking?.hide_border,
                      } as any}
                      size={30}
                      color={MarkingColor}
                    />
                    <Text
                      style={{
                        ...styles.title,
                        color: theme.screen.text,
                        fontSize: 14,
                      }}
                    >
                      {markingText}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
      </View>
      <MarkingBottomSheet ref={menuSheetRef} onClose={closeMenuSheet} />
    </ScrollView>
  );
};

export default index;
