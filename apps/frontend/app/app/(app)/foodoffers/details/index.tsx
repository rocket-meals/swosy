import React from 'react';
import { SafeAreaView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import FoodOfferDetailsContent from '@/components/FoodOfferDetailsContent/FoodOfferDetailsContent';
import styles from './styles';

export default function FoodDetailsScreen() {
    useSetPageTitle(TranslationKeys.food_details);

    const { id, foodId } = useLocalSearchParams();
    const offerId = Array.isArray(id) ? id[0] : id;
    const initialFoodId = Array.isArray(foodId) ? foodId[0] : foodId;

    const { theme } = useTheme();

    return (
        <SafeAreaView
            style={[styles.safeArea, { backgroundColor: theme.screen.background }]}
        >
            <FoodOfferDetailsContent
                offerId={offerId}
                foodId={initialFoodId}
            />
        </SafeAreaView>
    );
}
