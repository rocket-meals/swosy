import React, { memo, useMemo } from 'react';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Tooltip, TooltipContent, TooltipText } from '@gluestack-ui/themed';
import IconButton from '@/components/UI/IconButton';
import { excerpt } from '@/constants/HelperFunctions';
import { TranslationKeys } from '@/locales/keys';
import styles from '../styles';
import { isWeb } from '@/constants/Constants';

interface NotificationSectionProps {
    theme: any;
    containerWidth: string | number;
    translate: (key: string) => string;
    previousFeedback: any;
    updateNotification: () => void;
    foodsAreaColor: string;
    foodDetails: any;
}

const NotificationSection = ({
    theme,
    containerWidth,
    translate,
    previousFeedback,
    updateNotification,
    foodsAreaColor,
    foodDetails,
}: NotificationSectionProps) => {
    const containerStyle = useMemo(() => ({
        backgroundColor: theme.drawerBg,
        width: containerWidth as any,
    }), [theme.drawerBg, containerWidth]);

    return (
        <View
            style={[
                styles.notificationContainer,
                containerStyle
            ]}
        >
            <Text
                style={[
                    styles.notificationBody,
                    { color: theme.screen.text },
                    isWeb ? styles.notificationTextWeb : styles.notificationTextMobile
                ]}
            >
                {translate(TranslationKeys.GET_NOTIFICATION_ON_AVAILABILITY)}
            </Text>
            {previousFeedback?.notify ? (
                <Tooltip
                    placement="top"
                    trigger={(triggerProps) => (
                        <IconButton
                            {...triggerProps}
                            style={[
                                styles.bellIconAtiveContainer,
                                { backgroundColor: foodsAreaColor },
                                isWeb ? styles.bellIconPaddingWeb : styles.bellIconPaddingMobile
                            ]}
                            onPress={updateNotification}
                        >
                            <MaterialIcons name="notifications-active" size={32} color={theme.screen.text} />
                        </IconButton>
                    )}
                >
                    <TooltipContent bg={theme.tooltip.background} py="$1" px="$2">
                        <TooltipText fontSize="$sm" color={theme.tooltip.text}>
                            {`${translate(TranslationKeys.notification)}: ${translate(TranslationKeys.active)}: ${excerpt(
                                foodDetails?.name,
                                90
                            )}`}
                        </TooltipText>
                    </TooltipContent>
                </Tooltip>
            ) : (
                <Tooltip
                    placement="top"
                    trigger={(triggerProps) => (
                        <IconButton
                            style={[
                                styles.bellIconContainer,
                                { borderColor: foodsAreaColor },
                                isWeb ? styles.bellIconPaddingWeb : styles.bellIconPaddingMobile
                            ]}
                            {...triggerProps}
                            onPress={updateNotification}
                        >
                            <MaterialIcons name="notifications" size={32} color={theme.screen.text} />
                        </IconButton>
                    )}
                >
                    <TooltipContent bg={theme.tooltip.background} py="$1" px="$2">
                        <TooltipText fontSize="$sm" color={theme.tooltip.text}>
                            {`${translate(TranslationKeys.notification)}: ${translate(TranslationKeys.inactive)}: ${excerpt(
                                foodDetails?.name,
                                90
                            )}`}
                        </TooltipText>
                    </TooltipContent>
                </Tooltip>
            )}
        </View>
    );
};

export default memo(NotificationSection, (prevProps, nextProps) => {
    return (
        prevProps.theme === nextProps.theme &&
        prevProps.containerWidth === nextProps.containerWidth &&
        prevProps.previousFeedback === nextProps.previousFeedback &&
        prevProps.foodsAreaColor === nextProps.foodsAreaColor &&
        prevProps.foodDetails === nextProps.foodDetails
    );
});
