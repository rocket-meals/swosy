import React, { useState } from 'react';
import {FlatList, StyleSheet, LayoutChangeEvent, ListRenderItem, ListRenderItemInfo} from 'react-native';
import {View} from "@/components/Themed";


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

    function renderGridItem(info: ListRenderItemInfo<T> ){
            return(
                <View
                    style={[
                        styles.item,
                        {
                            width: flexDirection === 'row' ? itemSize : '100%',
                            height: flexDirection === 'column' ? itemSize : '100%',
                        },
                    ]}
                >
                    {renderItem({...info})}
                </View>
            );
        }

    return (
        <View style={styles.container} onLayout={onLayout}>
            <FlatList
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