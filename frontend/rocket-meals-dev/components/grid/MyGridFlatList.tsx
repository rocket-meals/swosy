import React from 'react';
import {FlatList, FlatListProps, ListRenderItem, ListRenderItemInfo} from 'react-native';
import {View} from '@/components/Themed';
import {ViewStyle} from 'react-native/Libraries/StyleSheet/StyleSheetTypes';
import {StyleProp} from 'react-native/Libraries/StyleSheet/StyleSheet';

/**
 * Defines the spacing properties for the grid list.
 *
 * @property {number} [marginOuter] - The margin applied to the outer side of the first and last item in a row.
 * @property {number} [marginInner] - The margin applied between items within a row.
 * @property {number} [marginRow] - The margin applied below each row.
 */
type GridListSpacing = {
    marginTop?: number,
    marginOuter?: number,
    marginInner?: number,
    marginRow?: number,
}

/**
 * Props for the MyGridList component.
 *
 * @template T The type of data items.
 *
 * @property {T[]} data - The data array to be rendered.
 * @property {ListRenderItem<T>} renderItem - The function that renders each item.
 * @property {number} gridAmount - The number of items per row.
 * @property {boolean} [horizontal] - If true, the list is horizontally scrollable.
 * @property {StyleProp<ViewStyle>} [contentContainerStyle] - Style for the list's content container.
 * @property {GridListSpacing} [spacing] - Spacing configuration for margins between items and rows.
 */
interface GridListProps<T> {
    data: T[];
    renderItem: ListRenderItem<T>;
    gridAmount: number;
    horizontal?: boolean;
    contentContainerStyle?: StyleProp<ViewStyle>;
    spacing?: GridListSpacing;
    flatListProps?: FlatListProps<T>
}

export const DEFAULT_GRID_LIST_SPACING: GridListSpacing = {
	marginTop: 6,
	marginOuter: 5,
	marginInner: 3,
	marginRow: 6,
}

/**
 * A custom grid list component that renders items in a grid layout.
 * Internally, it uses a FlatList to render the items. Customize the FlatList by passing flatListProps.
 *
 * This component supports both vertical and horizontal layouts, customizable spacing
 * between items and rows, and automatically fills the last row with dummy items if needed
 * to maintain the grid structure.
 *
 * @template T The type of data items. Each item must have a unique `key` property.
 *
 * @param {GridListProps<T>} props - The properties of the component.
 * @returns {React.ReactElement} The rendered grid list.
 */
export const MyGridFlatList = <T extends { key: string }>({
	data,
	renderItem,
	gridAmount,
	horizontal,
	spacing,
	flatListProps,
}: GridListProps<T>): React.ReactElement => {
	const amountCompleteRows = Math.floor(data.length / gridAmount);
	const amountTotalItemsLastRow = data.length - amountCompleteRows * gridAmount;
	const amountDummyItemsNeeded = amountTotalItemsLastRow > 0 ? gridAmount - amountTotalItemsLastRow : 0;

	const usedSpacing = spacing || DEFAULT_GRID_LIST_SPACING;

	const dummyKey = 'dummy';

	const adjustedData = [...data, ...Array(amountDummyItemsNeeded).fill({ key: dummyKey, isDummy: true })];
	// We need to add dummy items. If we don't, the last row will be max width stretched to fill the container, which is not what we want.

	const renderSingleItem = (content: any, key: string, index: number) => {
		const isFirstRow = index < gridAmount;
		const isFirstInRow = (index % gridAmount) === 0;
		const isLastInRow = (index % gridAmount) === gridAmount - 1;
		const isInCenter = !isFirstInRow && !isLastInRow;

		const itemStyle: StyleProp<ViewStyle>= {
			flex: 1,
		};

		// row margin
		if (usedSpacing?.marginRow) {
			itemStyle.marginBottom = usedSpacing.marginRow;
		}

		if (usedSpacing?.marginTop && isFirstRow) {
			itemStyle.marginTop = usedSpacing.marginTop;
		}

		// outer margin only for the first item in a row
		if (usedSpacing?.marginOuter) {
			if (isFirstInRow) {
				itemStyle.marginLeft = usedSpacing.marginOuter;
			}
			if (isLastInRow) {
				itemStyle.marginRight = usedSpacing.marginOuter;
			}
		}

		// inner margin
		if (usedSpacing?.marginInner) {
			if (isInCenter) {
				itemStyle.marginLeft = usedSpacing.marginInner;
				itemStyle.marginRight = usedSpacing.marginInner;
			}
			if (isFirstInRow) {
				itemStyle.marginRight = usedSpacing.marginInner;
			}
			if (isLastInRow) {
				itemStyle.marginLeft = usedSpacing.marginInner;
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

		// @ts-ignore
		if (item?.isDummy) {
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
	const flatListKey = 'horizontal:'+usedHorizontal+'-gridAmount:'+gridAmount;

	return (
		<View
			style={{
				width: '100%',
				height: '100%',
				//backgroundColor: "green",
			}}
		>
			<FlatList
				key={flatListKey}
				horizontal={usedHorizontal}
				data={adjustedData}
				renderItem={renderItemsWithFillUpDummies}
				numColumns={numColumns}
				{...flatListProps}
			/>
		</View>
	);
};