import { useState, useEffect, useCallback } from 'react';
import { runAfterInteractions } from '@/helper/interactionHelper';
import { fetchFoodDetailsById, fetchFoodOffersDetailsById } from '@/redux/actions/FoodOffers/FoodOffers';
import { DatabaseTypes } from 'repo-depkit-common';
import { useLanguage } from '@/hooks/useLanguage';
import useToast from '@/hooks/useToast';
import { TranslationKeys } from '@/locales/keys';

interface UseFoodDetailsProps {
    offerId?: string | string[];
    initialFoodId?: string | string[];
}

export const useFoodDetails = ({ offerId, initialFoodId }: UseFoodDetailsProps) => {
    const { language: languageCode, translate } = useLanguage();
    const toast = useToast();
    const [foodDetails, setFoodDetails] = useState<any>(null);
    const [foodAttributes, setFoodAttributes] = useState<any>([]);
    const [loading, setLoading] = useState(false);

    const getFoodDetails = useCallback(async () => {
        const id = Array.isArray(offerId) ? offerId[0] : offerId;
        const foodId = Array.isArray(initialFoodId) ? initialFoodId[0] : initialFoodId;

        if (!id && !foodId) return;

        setLoading(true);
        try {
            if (id) {
                const foodData = await fetchFoodOffersDetailsById(id.toString());
                if (foodData && foodData.data) {
                    const { food, attribute_values, foodoffer_category } = foodData?.data ?? {};

                    const translation = food?.translations?.find(
                        (val: DatabaseTypes.FoodsTranslations) => String(val?.languages_code)?.split('-')[0] === languageCode
                    );
                    setFoodDetails({
                        ...food,
                        foodoffer_category,
                        name: translation ? translation.name : null,
                    });
                    if (attribute_values) {
                        setFoodAttributes(attribute_values);
                    }
                }
            } else if (foodId) {
                const foodData = await fetchFoodDetailsById(foodId.toString());
                if (foodData && foodData.data) {
                    const food = foodData.data;
                    const translation = food?.translations?.find(
                        (val: DatabaseTypes.FoodsTranslations) => String(val?.languages_code)?.split('-')[0] === languageCode
                    );
                    setFoodDetails({
                        ...food,
                        name: translation ? translation.name : food?.name ?? null,
                    });

                    const attributes = food?.attribute_values || food?.foods_attributes_values;
                    if (attributes) {
                        setFoodAttributes(attributes);
                    }
                }
            }
        } catch (e: any) {
            console.error('Error fetching food details: ', e);
            toast(e.message || translate(TranslationKeys.somethingWentWrong), 'error');
        } finally {
            setLoading(false);
        }
    }, [offerId, initialFoodId, languageCode, toast, translate]);

    useEffect(() => {
        runAfterInteractions(() => {
            getFoodDetails();
        });
    }, [getFoodDetails]);

    return { foodDetails, foodAttributes, loading };
};
