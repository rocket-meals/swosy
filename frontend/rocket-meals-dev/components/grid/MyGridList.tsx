import React from 'react';
import {FlatList, ListRenderItem, ListRenderItemInfo} from 'react-native';
import {View} from "@/components/Themed";
import {ViewStyle} from "react-native/Libraries/StyleSheet/StyleSheetTypes";
import {StyleProp} from "react-native/Libraries/StyleSheet/StyleSheet";


interface DataItem {
    key: string;
    // Add other properties as needed
}

interface GridListProps<T> {
    data: T[];
    renderItem: ListRenderItem<T>;
    gridAmount: number;
    horizontal?: boolean;
    contentContainerStyle?: StyleProp<ViewStyle>;
}

export const MyGridList = <T extends { key: string }>({
                                                 data,
                                                 renderItem,
                                                 gridAmount,
                                                 horizontal,
                                                ...props
                                             }: GridListProps<T>) => {
    const completeRows = Math.floor(data.length / gridAmount);
    const totalItemsLastRow = data.length - completeRows * gridAmount;
    const dummyItemsNeeded = totalItemsLastRow > 0 ? gridAmount - totalItemsLastRow : 0;

    const dummyKey = 'dummy';

    const adjustedData = [...data, ...Array(dummyItemsNeeded).fill({ key: dummyKey, isDummy: true })];
    // We need to add dummy items. If we don't, the last row will be max width stretched to fill the container, which is not what we want.

    const renderSingleItem = (content: any, key: string) => {
        return(
            <View
                key={key}
                style={{
                    flex: 1, // CAUTION: Test on Android if you want to remove this line with MyCardForResourcesWithImage
                }}
            >
                {content}
            </View>
        )
    }

    /**
     * @param info
     */
    const renderItemsWithFillUpDummies = (info: ListRenderItemInfo<T>) => {

        const {item, index} = info;
        // We first render the item with the correct dimensions
        // Then we wrap it with flex: 1 to fill the remaining space in the container for the child

        if(item?.isDummy){
            const dummyKey = `dummy-${index}`;
            return renderSingleItem(null, dummyKey);
        }

        return renderSingleItem(renderItem(info), item.key);
    };

    const usedHorizontal = horizontal;
    const numColumns = !usedHorizontal ? gridAmount : undefined // numColumns does not support horizontal

    // FlatList: Changing numColumns on the fly is not supported
    // FlatList: Changing horizontal on the fly is not supported
    // Force a fresh render of the FlatList by changing the key
    const flatListKey = "horizontal:"+usedHorizontal+"-gridAmount:"+gridAmount;

    return (
        <View
            style={{
                width: "100%",
                height: "100%",
                //backgroundColor: "green",
            }}
        >
            <FlatList
                key={flatListKey}
                horizontal={usedHorizontal}
                data={adjustedData}

                renderItem={renderItemsWithFillUpDummies}
                numColumns={numColumns}
                {...props}
            />
        </View>
    );
};