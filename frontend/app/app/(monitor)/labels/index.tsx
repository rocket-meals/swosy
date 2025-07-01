import { Image } from 'expo-image';
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import styles from './styles';
import { useSelector } from 'react-redux';
import { getImageUrl } from '@/constants/HelperFunctions';
import { getTextFromTranslation } from '@/helper/resourceHelper';
import { useMyContrastColor } from '@/helper/colorHelper';
import { useTheme } from '@/hooks/useTheme';
import LabelHeader from '@/components/LabelHeader/LabelHeader';
import MarkingIcon from '@/components/MarkingIcon';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { RootState } from '@/redux/reducer';

const index = () => {
  const { theme } = useTheme();
  useSetPageTitle(TranslationKeys.markings);

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
      <LabelHeader Label={'Labels'} />

      <View style={styles.gridContainer}>
        {chunkedMarkings &&
          chunkedMarkings?.map((chunk, chunkIndex) => (
            <View key={chunkIndex} style={styles.mainContainer}>
              {chunk.map((marking, index) => {
                const markingImage = marking?.image_remote_url
                  ? { uri: marking?.image_remote_url }
                  : { uri: getImageUrl(String(marking?.image)) };
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
                  <View key={index} style={styles.iconText}>
                    {markingImage?.uri && (
                      <Image
                        source={markingImage}
                        style={[
                          styles.logoImage,
                          markingImage?.uri && {
                            backgroundColor: marking?.background_color
                              ? marking?.background_color
                              : 'transparent',
                            borderRadius: marking?.background_color ? 8 : 0,
                          },
                        ]}
                      />
                    )}
                    <MarkingIcon
                      marking={{
                        icon: marking?.icon,
                        short_code: marking?.short_code,
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
                  </View>
                );
              })}
            </View>
          ))}
      </View>
    </ScrollView>
  );
};

export default index;
