import React, { memo, useCallback } from 'react';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tooltip, TooltipContent, TooltipText } from '@gluestack-ui/themed';
import IconButton from '@/components/UI/IconButton';
import { TranslationKeys } from '@/locales/keys';
import styles from '../styles';
import { isWeb } from '@/constants/Constants';

interface TabControllerProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    theme: any;
    contrastColor: string;
    translate: (key: string) => string;
    containerWidth: string | number;
    foodsAreaColor: string;
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
    const getTabStyle = useCallback((tabName: string) => [
        styles.tab,
        activeTab === tabName 
            ? { backgroundColor: foodsAreaColor, borderColor: foodsAreaColor } 
            : { backgroundColor: theme.screen.iconBg }
    ], [activeTab, foodsAreaColor, theme.screen.iconBg]);

    const renderTab = (tabName: string, iconName: any, labelKey: string) => (
        <Tooltip
            placement="top"
            trigger={(triggerProps) => (
                <IconButton
                    {...triggerProps}
                    style={getTabStyle(tabName)}
                    onPress={() => setActiveTab(tabName)}
                    padding={10}
                >
                    <MaterialCommunityIcons
                        name={iconName}
                        size={26}
                        color={activeTab === tabName ? contrastColor : theme.screen.icon}
                    />
                </IconButton>
            )}
        >
            <TooltipContent bg={theme.tooltip.background} py="$1" px="$2">
                <TooltipText fontSize="$sm" color={theme.tooltip.text}>
                    {translate(labelKey)}
                </TooltipText>
            </TooltipContent>
        </Tooltip>
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
                {renderTab('feedbacks', 'chat', TranslationKeys.food_feedbacks)}
                {renderTab('details', 'nutrition', TranslationKeys.food_data)}
                {renderTab('labels', 'medical-bag', TranslationKeys.markings)}
            </View>
        </View>
    );
};

export default memo(TabController);
