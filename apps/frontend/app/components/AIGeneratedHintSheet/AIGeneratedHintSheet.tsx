import React from 'react';
import { Text, View } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { isWeb } from '@/constants/Constants';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import styles from './styles';
import { AIGeneratedHintSheetProps } from './types';

const AIGeneratedHintSheet: React.FC<AIGeneratedHintSheetProps> = () => {
        const { theme } = useTheme();
        const { translate } = useLanguage();

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
                                        {translate(TranslationKeys.ai_generated_image)}
                                </Text>
                        </View>
                        <Text style={{ ...styles.sheetDescription, color: theme.sheet.text }}>
                                {translate(TranslationKeys.ai_generated_image_hint)}
                        </Text>
                </BottomSheetScrollView>
        );
};

export default AIGeneratedHintSheet;
