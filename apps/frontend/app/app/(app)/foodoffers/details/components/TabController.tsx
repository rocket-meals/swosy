import React, { memo, useCallback } from 'react';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CustomTooltip, TooltipContent, TooltipText } from '@/components/CustomTooltip';
import IconButton from '@/components/UI/IconButton';
import { TranslationKeys } from '@/locales/keys';
import styles from '../styles';
import { isWeb } from '@/constants/Constants';
import { FoodAreaDisplayProps } from './types';
import { FoodOfferDetailTab } from '@/constants/TabEnums';

interface TabControllerProps extends FoodAreaDisplayProps {
    activeTab: FoodOfferDetailTab;
    setActiveTab: (tab: FoodOfferDetailTab) => void;
    contrastColor: string;
    translate: (key: string) => string;
    containerWidth: string | number;
}

const TabTriggerButton = ({
    triggerProps,
    style,
    iconName,
    iconColor,
    onSelect,
}: {
    triggerProps: any;
    style: any;
    iconName: any;
    iconColor: string;
    onSelect: () => void;
}) => (
    <IconButton
        {...triggerProps}
        style={style}
        activeOpacity={1}
        onPress={(e: any) => {
            onSelect();
            if (triggerProps.onPress) {
                triggerProps.onPress(e);
            }
        }}
        padding={10}
    >
        <MaterialCommunityIcons name={iconName} size={26} color={iconColor} />
    </IconButton>
);

// Factory returning a stable `trigger` render-prop for CustomTooltip, so no
// new function-that-returns-JSX is defined inside the parent component body.
function makeTabTrigger(style: any, iconName: any, iconColor: string, onSelect: () => void) {
    return (triggerProps: any) => (
        <TabTriggerButton triggerProps={triggerProps} style={style} iconName={iconName} iconColor={iconColor} onSelect={onSelect} />
    );
}

const TabController = ({
    activeTab,
    setActiveTab,
    theme,
    contrastColor,
    translate,
    containerWidth,
    foodsAreaColor,
}: TabControllerProps) => {
    const getTabStyle = useCallback((tabName: FoodOfferDetailTab) => [
        styles.tab,
        activeTab === tabName 
            ? { backgroundColor: foodsAreaColor, borderColor: foodsAreaColor } 
            : { backgroundColor: theme.screen.iconBg }
    ], [activeTab, foodsAreaColor, theme.screen.iconBg]);

    const renderTab = (tabName: FoodOfferDetailTab, iconName: any, labelKey: string) => (
        <CustomTooltip
            placement="top"
            trigger={makeTabTrigger(
                getTabStyle(tabName),
                iconName,
                activeTab === tabName ? contrastColor : theme.screen.icon,
                () => setActiveTab(tabName)
            )}
        >
            <TooltipContent bg={theme.tooltip.background} py="$1" px="$2">
                <TooltipText fontSize="$sm" color={theme.tooltip.text}>
                    {translate(labelKey)}
                </TooltipText>
            </TooltipContent>
        </CustomTooltip>
    );

    return (
        <View
            style={[
                styles.tabViewContainer,
                { width: containerWidth as number }
            ]}
        >
            <View
                style={[
                    styles.tabs,
                    isWeb ? styles.tabsWeb : styles.tabsMobile
                ]}
            >
                {renderTab(FoodOfferDetailTab.FEEDBACKS, 'chat', TranslationKeys.food_feedbacks)}
                {renderTab(FoodOfferDetailTab.DETAILS, 'nutrition', TranslationKeys.food_data)}
                {renderTab(FoodOfferDetailTab.LABELS, 'medical-bag', TranslationKeys.markings)}
            </View>
        </View>
    );
};

export default memo(TabController, (prevProps, nextProps) => {
    return (
        prevProps.activeTab === nextProps.activeTab &&
        prevProps.theme === nextProps.theme &&
        prevProps.contrastColor === nextProps.contrastColor &&
        prevProps.containerWidth === nextProps.containerWidth &&
        prevProps.foodsAreaColor === nextProps.foodsAreaColor
    );
});
