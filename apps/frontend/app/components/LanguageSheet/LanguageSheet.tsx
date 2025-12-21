import React from 'react';
import { Text, View } from 'react-native';
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
import { myContrastColor } from '@/helper/ColorHelper';
import MyImage from '@/components/MyImage';
import SettingsList from '@/components/SettingsList/SettingsList';

const LanguageSheet: React.FC<LanguageSheetProps> = ({ closeSheet, selectedLanguage, onSelect }) => {
        const { theme } = useTheme();
        const { translate } = useLanguage();
        const { primaryColor, selectedTheme: mode } = useSelector((state: RootState) => state.settings);
        const contrastColor = myContrastColor(primaryColor, theme, mode === 'dark');

        return (
                <BottomSheetScrollView style={{ ...styles.sheetView, backgroundColor: theme.sheet.sheetBg }} contentContainerStyle={styles.contentContainer}>
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
                                {languages.map((language, index) => {
                                        const isSelected = selectedLanguage === language.value;
                                        const groupPosition =
                                                languages.length === 1
                                                        ? 'single'
                                                        : index === 0
                                                                ? 'top'
                                                                : index === languages.length - 1
                                                                        ? 'bottom'
                                                                        : 'middle';

                                        return (
                                                <SettingsList
                                                        key={language.value}
                                                        leftIcon={<MyImage source={language.flag} style={styles.flagIcon} />}
                                                        label={language.label}
                                                        rightElement={
                                                                <View
                                                                        style={[
                                                                                styles.selectionIndicator,
                                                                                {
                                                                                        backgroundColor: isSelected ? primaryColor : 'transparent',
                                                                                        borderColor: isSelected ? primaryColor : theme.screen.icon,
                                                                                },
                                                                        ]}
                                                                >
                                                                        {isSelected ? <MaterialCommunityIcons name="check" size={18} color={contrastColor} /> : null}
                                                                </View>
                                                        }
                                                        handleFunction={() => {
                                                                onSelect(language.value);
                                                                closeSheet();
                                                        }}
                                                        showSeparator={index !== languages.length - 1}
                                                        groupPosition={groupPosition as any}
                                                        iconBackgroundColor="transparent"
                                                />
                                        );
                                })}
                        </View>
                </BottomSheetScrollView>
        );
};

export default LanguageSheet;
