import React, { memo } from 'react';
import { View } from 'react-native';
import FoodItem from '@/components/FoodItem/FoodItem';
import FoodOfferInfoItem from '@/components/FoodOfferInfoItem/FoodOfferInfoItem';
import { DatabaseTypes } from 'repo-depkit-common';
import styles from '../styles';

interface DayItem {
    foodoffer: DatabaseTypes.Foodoffers | null;
    foodofferInfoItem: DatabaseTypes.FoodoffersInfoItems | null;
}

interface FoodOfferListItemProps {
    item: DayItem;
    index: number;
    cardWidth: number;
    selectedCanteen: DatabaseTypes.Canteens | null;
    handleMenuSheet: (sheet: any, props?: any) => void;
    handleImageSheet: (food: DatabaseTypes.Foods) => void;
    handleEatingHabitsSheet: (sheet: any) => void;
    getInfoItemContent: (item: DatabaseTypes.FoodoffersInfoItems) => { content: string };
    itemGap?: number;
}

const FoodOfferListItem: React.FC<FoodOfferListItemProps> = ({
    item,
    index,
    cardWidth,
    selectedCanteen,
    handleMenuSheet,
    handleImageSheet,
    handleEatingHabitsSheet,
    getInfoItemContent,
}) => {
    return (
        <View
            style={[
                styles.listItemContainer
            ]}
        >
            {item.foodoffer ? (
                <FoodItem
                    canteen={selectedCanteen as any}
                    item={item.foodoffer}
                    key={item.foodoffer.id || `food-item-${index}`}
                    handleMenuSheet={handleMenuSheet}
                    handleImageSheet={handleImageSheet}
                    handleEatingHabitsSheet={handleEatingHabitsSheet}
                    cardWidth={cardWidth}
                />
            ) : item.foodofferInfoItem ? (
                <FoodOfferInfoItem
                    key={item.foodofferInfoItem.id || `info-item-${index}`}
                    item={item.foodofferInfoItem}
                    content={
                        (getInfoItemContent(item.foodofferInfoItem) || {}).content || ''
                    }
                    cardWidth={cardWidth}
                />
            ) : null}
        </View>
    );
};

export default memo(FoodOfferListItem);
