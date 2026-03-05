import React, { memo } from 'react';
import { View } from 'react-native';
import { Foundation, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tooltip, TooltipContent, TooltipText } from '@gluestack-ui/themed';
import IconButton from '@/components/UI/IconButton';
import { TranslationKeys } from '@/locales/keys';
import styles from '../styles';

type TabType = 'information' | 'description';

interface DetailsTabsProps {
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
    screenWidth: number;
    theme: any;
    themeStyles: any;
    contrastColor: string;
    translate: (key: string) => string;
    children: React.ReactNode;
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
                <Tooltip
                    placement="top"
                    trigger={triggerProps => (
                        <IconButton
                            {...triggerProps}
                            onPress={() => setActiveTab('information')}
                            style={[
                                styles.tab,
                                activeTab === 'information' ? themeStyles : { backgroundColor: theme.screen.iconBg }
                            ]}
                        >
                            <Foundation
                                name="info"
                                size={26}
                                color={activeTab === 'information' ? contrastColor : theme.screen.icon}
                            />
                        </IconButton>
                    )}
                >
                    <TooltipContent bg={theme.tooltip.background} py="$1" px="$2">
                        <TooltipText fontSize="$sm" color={theme.tooltip.text}>
                            {`${translate(TranslationKeys.information)}`}
                        </TooltipText>
                    </TooltipContent>
                </Tooltip>

                <Tooltip
                    placement="top"
                    trigger={triggerProps => (
                        <IconButton
                            {...triggerProps}
                            style={[
                                styles.tab,
                                activeTab === 'description' ? themeStyles : { backgroundColor: theme.screen.iconBg }
                            ]}
                            onPress={() => setActiveTab('description')}
                        >
                            <MaterialCommunityIcons
                                name="sort-variant"
                                size={26}
                                color={activeTab === 'description' ? contrastColor : theme.screen.icon}
                            />
                        </IconButton>
                    )}
                >
                    <TooltipContent bg={theme.tooltip.background} py="$1" px="$2">
                        <TooltipText fontSize="$sm" color={theme.tooltip.text}>
                            {`${translate(TranslationKeys.description)}`}
                        </TooltipText>
                    </TooltipContent>
                </Tooltip>
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
