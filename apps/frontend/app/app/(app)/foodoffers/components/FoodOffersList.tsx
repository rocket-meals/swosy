import React, { useCallback, memo } from 'react';
import { View, RefreshControl, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { DatabaseTypes } from 'repo-depkit-common';
import FoodOfferListItem from './FoodOfferListItem';

interface DayItem {
    foodoffer: DatabaseTypes.Foodoffers | null;
    foodofferInfoItem: DatabaseTypes.FoodoffersInfoItems | null;
}

interface FoodOffersListProps {
    dayItems: DayItem[];
    numColumns: number;
    cardWidth: number;
    refreshing: boolean;
    onRefresh: () => void;
    ListFooterComponent: React.ReactElement | null;
    ListEmptyComponent: React.ReactElement | null;
    setListWidth: (width: number) => void;
    listWidth: number | null;
    
    // Props for rendering items
    selectedCanteen: DatabaseTypes.Canteens | null;
    handleMenuSheet: (sheet: any, props?: any) => void;
    handleImageSheet: (food: DatabaseTypes.Foods) => void;
    handleEatingHabitsSheet: (sheet: any) => void;
    getInfoItemContent: (item: DatabaseTypes.FoodoffersInfoItems) => { content: string };
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
    },
    listContainer: {
        width: '100%',
        // maxWidth: 1420,
        flex: 1,
    },
    flashListContent: {
        marginTop: 20,
    },
});

const FoodOffersList: React.FC<FoodOffersListProps> = ({
    dayItems,
    numColumns,
    cardWidth,
    refreshing,
    onRefresh,
    ListFooterComponent,
    ListEmptyComponent,
    setListWidth,
    listWidth,
    selectedCanteen,
    handleMenuSheet,
    handleImageSheet,
    handleEatingHabitsSheet,
    getInfoItemContent,
}) => {

    const renderItem = useCallback(({ item, index }: { item: DayItem; index: number }) => {
        return (
            <FoodOfferListItem
                item={item}
                index={index}
                cardWidth={cardWidth}
                selectedCanteen={selectedCanteen}
                handleMenuSheet={handleMenuSheet}
                handleImageSheet={handleImageSheet}
                handleEatingHabitsSheet={handleEatingHabitsSheet}
                getInfoItemContent={getInfoItemContent}
            />
        );
    }, [cardWidth, selectedCanteen, handleMenuSheet, handleImageSheet, handleEatingHabitsSheet, getInfoItemContent]);

    const keyExtractor = useCallback((item: DayItem, index: number) => {
        if (item.foodoffer && item.foodoffer.id) return `f-${item.foodoffer.id}`;
        if (item.foodofferInfoItem && item.foodofferInfoItem.id) return `i-${item.foodofferInfoItem.id}`;
        return `di-${index}`;
    }, []);

    return (
        <View style={styles.container}>
            <View
                style={styles.listContainer}
                onLayout={e => {
                    const w = e.nativeEvent.layout.width;
                    if (w && w !== listWidth) {
                        setListWidth(w);
                    }
                }}
            >
                <FlashList
                    key={numColumns} // Force re-render when numColumns changes
                    data={dayItems}
                    extraData={cardWidth}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    numColumns={numColumns}
                    // @ts-ignore: estimatedItemSize is missing in the type definition but required for performance
                    estimatedItemSize={280}
                    contentContainerStyle={styles.flashListContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListFooterComponent={ListFooterComponent}
                    ListEmptyComponent={ListEmptyComponent}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        </View>
    );
};

export default memo(FoodOffersList, (prev, next) => {
    const isSame = 
        prev.dayItems === next.dayItems &&
        prev.numColumns === next.numColumns &&
        prev.cardWidth === next.cardWidth &&
        prev.refreshing === next.refreshing &&
        prev.listWidth === next.listWidth &&
        prev.selectedCanteen === next.selectedCanteen &&
        prev.onRefresh === next.onRefresh &&
        prev.setListWidth === next.setListWidth &&
        prev.handleMenuSheet === next.handleMenuSheet &&
        prev.handleImageSheet === next.handleImageSheet &&
        prev.handleEatingHabitsSheet === next.handleEatingHabitsSheet &&
        prev.getInfoItemContent === next.getInfoItemContent &&
        prev.ListFooterComponent === next.ListFooterComponent;

    if (!isSame) return false;

    // If everything else is same, check ListEmptyComponent ONLY if list is empty
    if (next.dayItems.length === 0) {
        return prev.ListEmptyComponent === next.ListEmptyComponent;
    }

    // If list has items, check if footer changed
    return prev.ListFooterComponent === next.ListFooterComponent;
});
