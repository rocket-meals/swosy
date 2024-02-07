import React from "react";
import {View, Text} from "@/components/Themed";
import {useInsets, useIsLargeDevice} from "@/helper/device/DeviceHelper";
import {Drawer} from "expo-router/drawer";
import {ScrollViewWithGradient} from "@/components/scrollview/ScrollViewWithGradient";
import {LegalRequiredLinks} from "@/components/legal/LegalRequiredLinks";
import {ProjectBanner} from "@/components/project/ProjectBanner";
import {MyTouchableOpacity} from "@/components/buttons/MyTouchableOpacity";
import {useProjectColor} from "@/helper/sync_state_helper/custom_sync_states/ProjectInfo";
import {DimensionValue, SafeAreaView} from "react-native";
import {useThemeDetermined} from "@/helper/sync_state_helper/custom_sync_states/ColorScheme";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {DrawerConfigPosition, useDrawerPosition} from "@/helper/sync_state_helper/custom_sync_states/DrawerSyncConfig";
import {DrawerContentComponentProps} from "@react-navigation/drawer/src/types";
import {getMyDrawerItemIcon} from "@/components/drawer/MyDrawerItemIcon";
import {MyDrawerCustomItemProps} from "@/components/drawer/MyDrawerCustomItem";
import {getMyDrawerHeader} from "@/components/drawer/MyDrawerHeader";
import {getMyDrawerItems} from "@/components/drawer/MyDrawerItems";
import {ViewStyle} from "react-native/Libraries/StyleSheet/StyleSheetTypes";
import {StyleProp} from "react-native/Libraries/StyleSheet/StyleSheet";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {SafeAreaViewProps} from "react-native-safe-area-context";

/**
 * Since SafeAreaView is not correctly working in screens without a header, we need to set the padding manually
 * @param props
 * @constructor
 */
export function MySafeAreaViewForScreensWithoutHeader({...props}: SafeAreaViewProps){
    const insets = useInsets()

    return(
        <MySafeAreaView {...props} style={{paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right, paddingBottom: insets.bottom}} />
    )

}