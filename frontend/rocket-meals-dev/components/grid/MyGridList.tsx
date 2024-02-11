import React from 'react';
import {FlatList, ListRenderItem, ListRenderItemInfo} from 'react-native';
import {View} from "@/components/Themed";
import {ViewStyle} from "react-native/Libraries/StyleSheet/StyleSheetTypes";
import {StyleProp} from "react-native/Libraries/StyleSheet/StyleSheet";

type GridListSpacing = {
    marginOuter?: number,
    marginInner?: number,
    marginRow?: number,
}


interface GridListProps<T> {
    data: T[];
    renderItem: ListRenderItem<T>;
    gridAmount: number;
    horizontal?: boolean;
    contentContainerStyle?: StyleProp<ViewStyle>;
    spacing?: GridListSpacing;
}

export const MyGridList = <T extends { key: string }>({
                                                 data,
                                                 renderItem,
                                                 gridAmount,
                                                 horizontal,
                                                spacing,
                                                ...props
                                             }: GridListProps<T>) => {

    const amountCompleteRows = Math.floor(data.length / gridAmount);
    const amountTotalItemsLastRow = data.length - amountCompleteRows * gridAmount;
    const amountDummyItemsNeeded = amountTotalItemsLastRow > 0 ? gridAmount - amountTotalItemsLastRow : 0;

    const dummyKey = 'dummy';

    const adjustedData = [...data, ...Array(amountDummyItemsNeeded).fill({ key: dummyKey, isDummy: true })];
    // We need to add dummy items. If we don't, the last row will be max width stretched to fill the container, which is not what we want.

    const renderSingleItem = (content: any, key: string, index: number) => {
        const isFirstInRow = (index % gridAmount) === 0;
        const isLastInRow = (index % gridAmount) === gridAmount - 1;
        const isInCenter = !isFirstInRow && !isLastInRow;

        let itemStyle: StyleProp<ViewStyle>= {
            flex: 1,
        };

        // row margin
        if (spacing?.marginRow) {
            itemStyle.marginBottom = spacing.marginRow;
        }

        // outer margin only for the first item in a row
        if (spacing?.marginOuter) {
            if (isFirstInRow) {
                itemStyle.marginLeft = spacing.marginOuter;
            }
            if (isLastInRow) {
                itemStyle.marginRight = spacing.marginOuter;
            }
        }

        // inner margin
        if (spacing?.marginInner) {
            if (isInCenter) {
                itemStyle.marginLeft = spacing.marginInner;
                itemStyle.marginRight = spacing.marginInner;
            }
            if(isFirstInRow){
                itemStyle.marginRight = spacing.marginInner;
            }
            if(isLastInRow){
                itemStyle.marginLeft = spacing.marginInner;
            }
        }


        return (
            <View key={key} style={itemStyle}>
                {content}
            </View>
        );
    }

    const renderItemsWithFillUpDummies = (info: ListRenderItemInfo<T>) => {

        const {item, index} = info;
        // We first render the item with the correct dimensions
        // Then we wrap it with flex: 1 to fill the remaining space in the container for the child

        if(item?.isDummy){
            const dummyKey = `dummy-${index}`;
            return renderSingleItem(null, dummyKey, index);
        }

        return renderSingleItem(renderItem(info), item.key, index);
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