import React, { useState } from 'react';
import {
    FlatList,
    StyleSheet,
    LayoutChangeEvent,
    ListRenderItem,
    ListRenderItemInfo,
    DimensionValue
} from 'react-native';
import {View, Text} from "@/components/Themed";


interface DataItem {
    key: string;
    // Add other properties as needed
}

interface GridListProps<T> {
    data: T[];
    renderItem: ListRenderItem<T>;
    gridAmount: number;
    flexDirection?: 'row' | 'column';
}

export const MyGridList = <T extends { key: string }>({
                                                 data,
                                                 renderItem,
                                                 gridAmount,
                                                 flexDirection = 'column', // Default direction set to 'column' for vertical scrolling
                                                ...props
                                             }: GridListProps<T>) => {
    const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

    const onLayout = (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setContainerSize({ width, height });
    };

    const isFlexDirectionRow = flexDirection === 'row';
    const itemSize = isFlexDirectionRow ? containerSize.width / gridAmount : containerSize.height / gridAmount;
    let itemHeight: DimensionValue | undefined = !isFlexDirectionRow ? itemSize : '100%'
    let itemWidth: DimensionValue | undefined = isFlexDirectionRow ? itemSize : '100%'

    const renderWrappedItemForCorrectDimension = (info: ListRenderItemInfo<T>) => {

        // We first render the item with the correct dimensions
        // Then we wrap it with flex: 1 to fill the remaining space in the container for the child

        return(
            <View style={
                {
                    backgroundColor: "red",
                    width: itemWidth,
                    height: itemHeight,
                }
            }>
            <View
                style={{
                    backgroundColor: "orange",
                    flex: 1, // CAUTION: Test on Android if you want to remove this line
                }}
            >
                    {renderItem({...info})}
            </View>
            </View>
        )
    };

    return (
        <View
            style={{
                width: "100%",
                height: "100%",
                backgroundColor: "green",
                padding: 10,
            }}
            onLayout={onLayout}>
            <Text>{JSON.stringify(containerSize, null, 2)}</Text>
            <FlatList
                data={data}
                renderItem={renderWrappedItemForCorrectDimension}
                numColumns={flexDirection === 'row' ? gridAmount : 1}
                {...props}
            />
        </View>
    );
};