import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { languages } from '@/constants/SettingData';
import { isWeb } from '@/constants/Constants';
import styles from './styles';
import { LanguageSheetProps } from './types';
import { TranslationKeys } from '@/locales/keys';
import { RootState } from '@/redux/reducer';
import { myContrastColor } from '@/helper/colorHelper';

const LanguageSheet: React.FC<LanguageSheetProps> = ({
  closeSheet,
  selectedLanguage,
  onSelect,
}) => {
  const { theme } = useTheme();
  const { translate } = useLanguage();
  const { primaryColor, selectedTheme: mode } = useSelector(
    (state: RootState) => state.settings
  );
  const contrastColor = myContrastColor(primaryColor, theme, mode === 'dark');

  return (
    <BottomSheetScrollView
      style={{ ...styles.sheetView, backgroundColor: theme.sheet.sheetBg }}
      contentContainerStyle={styles.contentContainer}
    >
      <View
        style={{
          ...styles.sheetHeader,
          paddingRight: isWeb ? 10 : 0,
          paddingTop: isWeb ? 10 : 0,
        }}
      >
        <View />
        <Text
          style={{
            ...styles.sheetHeading,
            fontSize: isWeb ? 40 : 28,
            color: theme.sheet.text,
          }}
        >
          {translate(TranslationKeys.language)}
        </Text>
      </View>
      <View style={styles.optionsContainer}>
        {languages.map((language, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.languageRow,
              {
                paddingHorizontal: isWeb ? 20 : 10,
                backgroundColor:
                  selectedLanguage === language.value
                    ? primaryColor
                    : theme.screen.iconBg,
              },
            ]}
            onPress={() => {
              onSelect(language.value);
              closeSheet();
            }}
          >
            <Image
              source={language.flag}
              style={styles.flagIcon}
              cachePolicy={'memory-disk'}
              transition={500}
              contentFit='cover'
            />
            <Text
              style={{
                ...styles.languageText,
                color:
                  selectedLanguage === language.value
                    ? contrastColor
                    : theme.screen.text,
              }}
            >
              {language.label}
            </Text>
            <MaterialCommunityIcons
              name={
                selectedLanguage === language.value
                  ? 'checkbox-marked'
                  : 'checkbox-blank'
              }
              size={24}
              color={
                selectedLanguage === language.value
                  ? contrastColor
                  : theme.screen.icon
              }
              style={styles.radioButton}
            />
          </TouchableOpacity>
        ))}
      </View>
    </BottomSheetScrollView>
  );
};

export default LanguageSheet;
