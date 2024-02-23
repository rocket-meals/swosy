import React from "react";
import {View} from "@/components/Themed"
import {DrawerContentComponentProps} from "@react-navigation/drawer/src/types";
import {getMyDrawerCustomItem, MyDrawerCustomItemProps} from "@/components/drawer/MyDrawerCustomItem";
import {getMyDrawerItemExpoGenerated} from "@/components/drawer/MyDrawerItemExpoGenerated";
import {ParamListBase, RouteProp} from "@react-navigation/native";

/**
 * Since our custom drawer items may have an ID or parameter used, which is not shown in the drawer routeName, we need to check if the current route is the same as the customItem.onPressInternalRouteTo
 *
 * @param customItem
 * @param props
 */
function configureCustomDrawerItemActiveIfInternalRouteIsUsed(customItem: MyDrawerCustomItemProps, props: DrawerContentWrapperProps) {

    let internalPath = customItem.onPressInternalRouteTo; // our custom item has a route where the user will be navigated to
    if(!!internalPath){ // if the custom item has a route
        if(internalPath.startsWith("/")) { // we will ignore if the first character is a slash
            internalPath = internalPath.substring(1);
        }

        const history = props.state.history;
        let latestRoute = history[history.length - 1];
        let latestRouteKey = latestRoute?.key; // we get the key of the latest route key which is a generated string

        // we now want to get the descriptor of the latest route
        const descriptors = props.descriptors; // The descriptors hold the screen information for the drawer which might be active
        let latestRouteDescriptor = descriptors[latestRouteKey]; // so we have the information about the descriptor of the latest route
        let latestRouteDescriptorRouteObject: RouteProp<ParamListBase> = latestRouteDescriptor?.route; // we get the route object of the descriptor
        let latestRouteNameWithUnresolvedParams = latestRouteDescriptorRouteObject?.name; // we get the name of the route
        // latestRouteParams is a dict with a string key and a string value
        let latestRouteParams: {[key: string]: string} | undefined = latestRouteDescriptorRouteObject?.params as {[key: string]: string} | undefined; // we get the params of the route
        // now we want to resolve the params of the route
        let latestRouteName = latestRouteNameWithUnresolvedParams; // we will use the unresolved route name as the default
        if(!!latestRouteParams){
            // latestRouteName is maybe /wikis/[id] and we want to resolve the id
            let paramsKeys = Object.keys(latestRouteParams);
            for(let i = 0; i < paramsKeys.length; i++){
                let key = paramsKeys[i];
                let value = latestRouteParams[key];
                latestRouteName = latestRouteName.replace("["+key+"]", value);
            }
        }


        // if the internalPath is the same as the latestRouteDescriptorPath, we will set the customItem.isFocused to true
        if(internalPath === latestRouteName){
            customItem.isFocused = true;
        }
    }
    return customItem;
}


type DrawerContentWrapperProps = {
    customDrawerItems?: MyDrawerCustomItemProps[]
} & DrawerContentComponentProps
export const getMyDrawerItems = (props: DrawerContentWrapperProps) => {

    console.log("getMyDrawerItems")
    console.log(props)

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
            let customItem = sortedCustomDrawerItems[customItemIndex];
            customItem = configureCustomDrawerItemActiveIfInternalRouteIsUsed(customItem, props);
            finalDrawerItems.push(getMyDrawerCustomItem(customItem)); // Assuming renderCustomDrawerItem is a function that returns a DrawerItem for a customDrawerItem
            customItemIndex++;
        }
        finalDrawerItems.push(item);
    });

    // Add any remaining customDrawerItems at the end
    while (customItemIndex < sortedCustomDrawerItems.length) {
        let customItem = sortedCustomDrawerItems[customItemIndex];
        customItem = configureCustomDrawerItemActiveIfInternalRouteIsUsed(customItem, props);
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