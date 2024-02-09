import React, { useState } from 'react';
import { View, FlatList, StyleSheet, LayoutChangeEvent, ListRenderItem } from 'react-native';
import {index} from "@zxing/text-encoding/es2015/encoding/indexes";

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
                                             }: GridListProps<T>) => {
    const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

    const onLayout = (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setContainerSize({ width, height });
    };

    const itemSize = flexDirection === 'row' ? containerSize.width / gridAmount : containerSize.height / gridAmount;

    const renderGridItem = ({ item, index }: { item: T; index: number }) => (
        <View
            style={[
                styles.item,
                {
                    width: flexDirection === 'row' ? itemSize : '100%',
                    height: flexDirection === 'column' ? itemSize : '100%',
                },
            ]}
        >
            {renderItem({
                separators: {
                    highlight: function () {
                    }, unhighlight: function () {
                    }, updateProps: function (p1: "leading" | "trailing", p2: any) {
                    }
                }, item, index })}
        </View>
    );

    return (
        <View style={styles.container} onLayout={onLayout}>
            <FlatList<T>
                contentContainerStyle={{
                    width: '100%',
                }}
                data={data}
                renderItem={renderGridItem}
                keyExtractor={(item) => item.key}
                numColumns={flexDirection === 'row' ? gridAmount : 1}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    item: {
        justifyContent: 'center',
        alignItems: 'center',
        margin: 5,
        // Add other styling as needed
    },
});