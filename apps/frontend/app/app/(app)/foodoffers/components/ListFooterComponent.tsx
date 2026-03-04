import React, { memo } from 'react';
import { Text, View } from 'react-native';
import styles from '../styles';
import { TranslationKeys } from '@/locales/keys';
import CustomMarkdown from '@/components/CustomMarkdown/CustomMarkdown';
import CollectibleSpot from '@/components/CollectibleItem/CollectibleSpot';
import { CollectibleAt } from 'repo-depkit-common';

interface ListFooterComponentProps {
    afterElement: any;
    feedbackLabelsLoading: boolean;
    canteenFeedbackLabelsExist: boolean;
    memoizedCanteenFeedbackLabels: React.ReactNode;
    foods_area_color: string;
    theme: any;
    translate: (key: string) => string;
    debugMode: boolean;
    cachedFoodOfferDates: string[];
    getDayLabel: (date: string) => string;
}

const ListFooterComponent: React.FC<ListFooterComponentProps> = ({
    afterElement,
    feedbackLabelsLoading,
    canteenFeedbackLabelsExist,
    memoizedCanteenFeedbackLabels,
    foods_area_color,
    theme,
    translate,
    debugMode,
    cachedFoodOfferDates,
    getDayLabel,
}) => {
    return (
        <>
            {afterElement && (
                <View style={styles.elementContainer}>
                    {afterElement && (
                        <CustomMarkdown
                            content={afterElement?.content || ''}
                            backgroundColor={foods_area_color}
                            imageWidth={440}
                            imageHeight={293}
                        />
                    )}
                </View>
            )}
            {!feedbackLabelsLoading && canteenFeedbackLabelsExist && (
                <View style={styles.feebackContainer}>
                    <View>
                        <Text style={[styles.foodLabels, { color: theme.screen.text }]}>
                            {translate(TranslationKeys.feedback_labels)}
                        </Text>
                    </View>
                    {memoizedCanteenFeedbackLabels}
                </View>
            )}
            {debugMode && (
                <View
                    style={[
                        styles.debugInfoContainer,
                        { borderColor: theme.screen.icon, backgroundColor: theme.screen.background },
                    ]}
                >
                    <Text style={[styles.debugTitle, { color: theme.screen.text }]}>
                        {translate(TranslationKeys.cached_foodoffers_days)}
                    </Text>
                    <Text style={[styles.debugText, { color: theme.screen.text }]}>
                        {cachedFoodOfferDates.map(date => `${getDayLabel(date)} (${date})`).join(', ') ||
                            translate(TranslationKeys.cached_foodoffers_days_empty)}
                    </Text>
                </View>
            )}
            <CollectibleSpot collectibleKey={CollectibleAt.collectible_at_foodoffers} />
            <View style={styles.footerSpacer} />
        </>
    );
};

export default memo(ListFooterComponent);
