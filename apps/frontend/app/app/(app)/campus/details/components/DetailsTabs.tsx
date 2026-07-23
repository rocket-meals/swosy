import React, { memo } from 'react';
import { View } from 'react-native';
import { Foundation, MaterialCommunityIcons } from '@expo/vector-icons';
import { CustomTooltip, TooltipContent, TooltipText } from '@/components/CustomTooltip';
import IconButton from '@/components/UI/IconButton';
import { TranslationKeys } from '@/locales/keys';
import styles from '../styles';
import { TabsStyleProps } from '@/components/shared/tabsStyleProps';
import { CampusDetailTab } from '@/constants/TabEnums';

interface DetailsTabsProps extends TabsStyleProps {
    activeTab: CampusDetailTab;
    setActiveTab: (tab: CampusDetailTab) => void;
    translate: (key: string) => string;
    children: React.ReactNode;
}

const TabIconButton = ({
    triggerProps,
    onPress,
    isActive,
    activeStyle,
    inactiveStyle,
    children,
}: {
    triggerProps: object;
    onPress: () => void;
    isActive: boolean;
    activeStyle: any;
    inactiveStyle: any;
    children: React.ReactNode;
}) => (
    <IconButton {...triggerProps} onPress={onPress} style={[styles.tab, isActive ? activeStyle : inactiveStyle]}>
        {children}
    </IconButton>
);

// Factory returning a stable `trigger` render-prop for CustomTooltip, so no
// new function-that-returns-JSX is defined inside the parent component body.
function makeTabTrigger(onPress: () => void, isActive: boolean, activeStyle: any, inactiveStyle: any, icon: React.ReactNode) {
    return (triggerProps: object) => (
        <TabIconButton triggerProps={triggerProps} onPress={onPress} isActive={isActive} activeStyle={activeStyle} inactiveStyle={inactiveStyle}>
            {icon}
        </TabIconButton>
    );
}

const DetailsTabs: React.FC<DetailsTabsProps> = ({
    activeTab,
    setActiveTab,
    screenWidth,
    theme,
    themeStyles,
    contrastColor,
    translate,
    children,
}) => {
    return (
        <View style={{ ...styles.tabViewContainer, width: '100%' }}>
            <View style={{ ...styles.tabs, width: '100%', gap: screenWidth > 900 ? 20 : 0 }}>
                <CustomTooltip
                    placement="top"
                    trigger={makeTabTrigger(
                        () => setActiveTab(CampusDetailTab.INFORMATION),
                        activeTab === CampusDetailTab.INFORMATION,
                        themeStyles,
                        { backgroundColor: theme.screen.iconBg },
                        <Foundation
                            name="info"
                            size={26}
                            color={activeTab === CampusDetailTab.INFORMATION ? contrastColor : theme.screen.icon}
                        />
                    )}
                >
                    <TooltipContent bg={theme.tooltip.background} py="$1" px="$2">
                        <TooltipText fontSize="$sm" color={theme.tooltip.text}>
                            {`${translate(TranslationKeys.information)}`}
                        </TooltipText>
                    </TooltipContent>
                </CustomTooltip>

                <CustomTooltip
                    placement="top"
                    trigger={makeTabTrigger(
                        () => setActiveTab(CampusDetailTab.DESCRIPTION),
                        activeTab === CampusDetailTab.DESCRIPTION,
                        themeStyles,
                        { backgroundColor: theme.screen.iconBg },
                        <MaterialCommunityIcons
                            name="sort-variant"
                            size={26}
                            color={activeTab === CampusDetailTab.DESCRIPTION ? contrastColor : theme.screen.icon}
                        />
                    )}
                >
                    <TooltipContent bg={theme.tooltip.background} py="$1" px="$2">
                        <TooltipText fontSize="$sm" color={theme.tooltip.text}>
                            {`${translate(TranslationKeys.description)}`}
                        </TooltipText>
                    </TooltipContent>
                </CustomTooltip>
            </View>

            <View
                style={{
                    ...styles.pagerView,
                    width: screenWidth > 900 ? '95%' : '100%',
                    paddingHorizontal: screenWidth > 900 ? 20 : 0
                }}
            >
                {children}
            </View>
        </View>
    );
};

export default memo(DetailsTabs);
