import React, { memo } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome6, Entypo, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tooltip, TooltipContent, TooltipText } from '@gluestack-ui/themed';
import { useNavigation, useRouter } from 'expo-router';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import IconButton from '@/components/UI/IconButton';
import { TranslationKeys } from '@/locales/keys';
import { excerpt } from '@/constants/HelperFunctions';
import { isWeb } from '@/constants/Constants';
import styles from '../styles';
import { RootDrawerParamList } from '../types';
import { DatabaseTypes } from 'repo-depkit-common';

interface FoodOffersHeaderProps {
    drawerPosition: 'left' | 'right';
    hasUnreadChats: boolean;
    selectedCanteen: DatabaseTypes.Canteens | null;
    selectedDate: string;
    profile: any;
    appSettings: any;
    openSheet: (sheet: any) => void;
    handleDateChange: (direction: 'prev' | 'next') => void;
    openUtilizationModal: (date: string, canteen: any) => void;
    getDayLabel: (date: string) => string;
}

const FoodOffersHeader: React.FC<FoodOffersHeaderProps> = ({
    drawerPosition,
    hasUnreadChats,
    selectedCanteen,
    selectedDate,
    profile,
    appSettings,
    openSheet,
    handleDateChange,
    openUtilizationModal,
    getDayLabel,
}) => {
    const { theme } = useTheme();
    const { translate } = useLanguage();
    const router = useRouter();
    const drawerNavigation = useNavigation<DrawerNavigationProp<RootDrawerParamList>>();
    const screenWidth = Dimensions.get('window').width;

    const getPriceGroup = (price_group: string) => {
        if (price_group) {
            return `price_group_${price_group?.toLocaleLowerCase()}`;
        }
        return '';
    };

    const iconPadding = isWeb ? (screenWidth < 500 ? 5 : 10) : 5;
    const arrowPadding = isWeb ? (screenWidth < 500 ? 2 : 5) : 2;

    return (
        <View
            style={{
                ...styles.header,
                backgroundColor: theme.header.background,
                paddingHorizontal: 10,
            }}
        >
            <View style={[styles.row, { flexDirection: drawerPosition === 'right' ? 'row-reverse' : 'row' }]}>
                <View style={[styles.col1, { flexDirection: drawerPosition === 'right' ? 'row-reverse' : 'row' }]}>
                    <Tooltip
                        placement="top"
                        trigger={triggerProps => (
                            <IconButton {...triggerProps} onPress={() => drawerNavigation.toggleDrawer()} style={{ padding: iconPadding }}>
                                <Ionicons name="menu" size={24} color={theme.header.text} />
                                {hasUnreadChats ? (
                                    <View
                                        style={[
                                            styles.notificationDot,
                                            {
                                                backgroundColor: theme.accent,
                                                borderColor: theme.header.background,
                                            },
                                        ]}
                                    />
                                ) : null}
                            </IconButton>
                        )}
                    >
                        <TooltipContent bg={theme.tooltip.background} py="$1" px="$2">
                            <TooltipText fontSize="$sm" color={theme.tooltip.text}>
                                {`${translate(TranslationKeys.open_drawer)}`}
                            </TooltipText>
                        </TooltipContent>
                    </Tooltip>

                    <TouchableOpacity
                        onPress={() => openSheet('canteen')}
                        activeOpacity={0.7}
                        style={{ padding: iconPadding }}
                    >
                        <Text style={{ ...styles.heading, color: theme.header.text }}>
                            {excerpt(String(selectedCanteen?.alias), screenWidth > 800 ? 30 : 10) || 'Food Offers'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={{ ...styles.col2, gap: isWeb ? (screenWidth < 500 ? 6 : 10) : 5, flexDirection: drawerPosition === 'right' ? 'row-reverse' : 'row' }}>
                    <Tooltip
                        placement="top"
                        trigger={triggerProps => (
                            <IconButton {...triggerProps} onPress={() => openSheet('sort')} style={{ padding: iconPadding }}>
                                <MaterialIcons name="sort" size={24} color={theme.header.text} />
                            </IconButton>
                        )}
                    >
                        <TooltipContent bg={theme.tooltip.background} py="$1" px="$2">
                            <TooltipText fontSize="$sm" color={theme.tooltip.text}>
                                {`${translate(TranslationKeys.sort)}: ${translate(TranslationKeys.foods)}`}
                            </TooltipText>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip
                        placement="top"
                        trigger={triggerProps => (
                            <IconButton {...triggerProps} onPress={() => router.navigate('/price-group')} style={{ padding: iconPadding }}>
                                <FontAwesome6 name="euro-sign" size={24} color={theme.header.text} />
                            </IconButton>
                        )}
                    >
                        <TooltipContent bg={theme.tooltip.background} py="$1" px="$2">
                            <TooltipText fontSize="$sm" color={theme.tooltip.text}>
                                {`${translate(TranslationKeys.edit)}: ${translate(TranslationKeys.price_group)} ${translate(getPriceGroup(profile?.price_group || ''))}`}
                            </TooltipText>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip
                        placement="top"
                        trigger={triggerProps => (
                            <IconButton {...triggerProps} onPress={() => router.navigate('/eating-habits')} style={{ padding: iconPadding }}>
                                <Ionicons name="bag-add" size={24} color={theme.header.text} />
                            </IconButton>
                        )}
                    >
                        <TooltipContent bg={theme.tooltip.background} py="$1" px="$2">
                            <TooltipText fontSize="$sm" color={theme.tooltip.text}>
                                {` ${translate(TranslationKeys.eating_habits)}: ${translate(TranslationKeys.edit)}`}
                            </TooltipText>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip
                        placement="top"
                        trigger={triggerProps => (
                            <IconButton {...triggerProps} onPress={() => openSheet('canteen')} style={{ padding: iconPadding }}>
                                <MaterialIcons name="restaurant-menu" size={24} color={theme.header.text} />
                            </IconButton>
                        )}
                    >
                        <TooltipContent bg={theme.tooltip.background} py="$1" px="$2">
                            <TooltipText fontSize="$sm" color={theme.tooltip.text}>
                                {` ${translate(TranslationKeys.canteen)}: ${translate(TranslationKeys.select)}`}
                            </TooltipText>
                        </TooltipContent>
                    </Tooltip>
                </View>
            </View>

            <View style={styles.row}>
                <View style={{ ...styles.col2, gap: isWeb ? (screenWidth < 500 ? 15 : 10) : 10 }}>
                    <Tooltip
                        placement="top"
                        trigger={triggerProps => (
                            <IconButton {...triggerProps} onPress={() => handleDateChange('prev')} style={{ padding: arrowPadding }}>
                                <Entypo name="chevron-left" size={24} color={theme.header.text} />
                            </IconButton>
                        )}
                    >
                        <TooltipContent bg={theme.tooltip.background} py="$1" px="$2">
                            <TooltipText fontSize="$sm" color={theme.tooltip.text}>
                                {` ${translate(TranslationKeys.day)}: ${translate(TranslationKeys.previous)}`}
                            </TooltipText>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip
                        placement="top"
                        trigger={triggerProps => (
                            <IconButton {...triggerProps} onPress={() => openSheet('calendar')} style={{ padding: arrowPadding }}>
                                <MaterialIcons name="calendar-month" size={24} color={theme.header.text} />
                            </IconButton>
                        )}
                    >
                        <TooltipContent bg={theme.tooltip.background} py="$1" px="$2">
                            <TooltipText fontSize="$sm" color={theme.tooltip.text}>
                                {` ${translate(TranslationKeys.edit)}: ${translate(TranslationKeys.date)}: ${selectedDate}`}
                            </TooltipText>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip
                        placement="top"
                        trigger={triggerProps => (
                            <IconButton {...triggerProps} onPress={() => handleDateChange('next')} style={{ padding: arrowPadding }}>
                                <Entypo name="chevron-right" size={24} color={theme.header.text} />
                            </IconButton>
                        )}
                    >
                        <TooltipContent bg={theme.tooltip.background} py="$1" px="$2">
                            <TooltipText fontSize="$sm" color={theme.tooltip.text}>
                                {` ${translate(TranslationKeys.day)}: ${translate(TranslationKeys.proceed)}`}
                            </TooltipText>
                        </TooltipContent>
                    </Tooltip>

                    <Text style={{ ...styles.heading, color: theme.header.text }}>{selectedDate ? translate(getDayLabel(selectedDate)) : ''}</Text>
                </View>

                <View style={{ ...styles.col2, gap: 10 }}>
                    {appSettings?.utilization_display_enabled && (
                        <Tooltip
                            placement="top"
                            trigger={triggerProps => (
                                <IconButton
                                    {...triggerProps}
                                    onPress={() => openUtilizationModal(selectedDate, selectedCanteen)}
                                    style={{ padding: arrowPadding }}
                                >
                                    <FontAwesome6 name="people-group" size={24} color={theme.header.text} />
                                </IconButton>
                            )}
                        >
                            <TooltipContent bg={theme.tooltip.background} py="$1" px="$2">
                                <TooltipText fontSize="$sm" color={theme.tooltip.text}>
                                    {` ${translate(TranslationKeys.forecast)}: ${translate(TranslationKeys.utilization)}`}
                                </TooltipText>
                            </TooltipContent>
                        </Tooltip>
                    )}

                    <Tooltip
                        placement="top"
                        trigger={triggerProps => (
                            <IconButton {...triggerProps} onPress={() => openSheet('hours')} style={{ padding: arrowPadding }}>
                                <MaterialCommunityIcons name="clock-time-eight" size={24} color={theme.header.text} />
                            </IconButton>
                        )}
                    >
                        <TooltipContent bg={theme.tooltip.background} py="$1" px="$2">
                            <TooltipText fontSize="$sm" color={theme.tooltip.text}>
                                {` ${translate(TranslationKeys.businesshours)}`}
                            </TooltipText>
                        </TooltipContent>
                    </Tooltip>
                </View>
            </View>
        </View>
    );
};

export default memo(FoodOffersHeader);
