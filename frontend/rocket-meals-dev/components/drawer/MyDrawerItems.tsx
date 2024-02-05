import React from "react";
import {View} from "@/components/Themed"
import {DrawerContentComponentProps} from "@react-navigation/drawer/src/types";
import {getMyDrawerCustomItem, MyDrawerCustomItemProps} from "@/components/drawer/MyDrawerCustomItem";
import {getMyDrawerItemExpoGenerated} from "@/components/drawer/MyDrawerItemExpoGenerated";

type DrawerContentWrapperProps = {
    customDrawerItems?: MyDrawerCustomItemProps[]
} & DrawerContentComponentProps
export const getMyDrawerItems = (props: DrawerContentWrapperProps) => {
    let generatedDrawerItems = props.state.routes.map((route: any, index: number) => {
        return getMyDrawerItemExpoGenerated(route, index, props);
    })

    // Step 1: Sort customDrawerItems by position
    const sortedCustomDrawerItems = (props.customDrawerItems || []).sort((a, b) => {
        // Assuming items without a position should be placed at the end
        const positionA = a.position !== undefined ? a.position : Number.MAX_VALUE;
        const positionB = b.position !== undefined ? b.position : Number.MAX_VALUE;
        return positionA - positionB;
    });
    // Add the customDrawerItem infront of the position of the renderedDrawerItems item

    // Step 2: Merge sortedCustomDrawerItems with renderedDrawerItems
    let finalDrawerItems = [];
    let customItemIndex = 0; // To keep track of our position in the sortedCustomDrawerItems

    generatedDrawerItems.forEach((item, index) => {
        // Add any customDrawerItems that should be placed before the current item
        while (customItemIndex < sortedCustomDrawerItems.length && sortedCustomDrawerItems[customItemIndex].position === index) {
            const customItem = sortedCustomDrawerItems[customItemIndex];
            finalDrawerItems.push(getMyDrawerCustomItem(customItem)); // Assuming renderCustomDrawerItem is a function that returns a DrawerItem for a customDrawerItem
            customItemIndex++;
        }
        finalDrawerItems.push(item);
    });

    // Add any remaining customDrawerItems at the end
    while (customItemIndex < sortedCustomDrawerItems.length) {
        const customItem = sortedCustomDrawerItems[customItemIndex];
        finalDrawerItems.push(getMyDrawerCustomItem(customItem));
        customItemIndex++;
    }

    let renderedDrawerItemsWithSeparator = finalDrawerItems.map((item: any, index: number) => {
        return(
            <View key={index}>
                {item}
            </View>
        )
    }   )

    return(
        renderedDrawerItemsWithSeparator
    );
}