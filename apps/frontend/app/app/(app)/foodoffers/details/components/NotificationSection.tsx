import React, { memo, useMemo } from 'react';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TranslationKeys } from '@/locales/keys';
import SettingsListBoolean from '@/components/SettingsListBoolean';
import { isWeb } from '@/constants/Constants';
import styles from '../styles';
import type { FoodDetailsSectionBaseProps } from './types';

interface NotificationSectionProps extends FoodDetailsSectionBaseProps {
    containerWidth: string | number;
    updateNotification: () => void;
}

const NotificationSection = ({
    theme,
    containerWidth,
    translate,
    previousFeedback,
    updateNotification,
    foodsAreaColor,
    isAccountRequired,
}: NotificationSectionProps) => {
    const isNotifyEnabled = !!previousFeedback?.notify;

    const containerStyle = useMemo(() => ({
        width: containerWidth as any,
    }), [containerWidth]);

    const bellIcon = useMemo(() => (
        <MaterialIcons
            name={isNotifyEnabled ? 'notifications-active' : 'notifications-off'}
            size={24}
        />
    ), [isNotifyEnabled]);

    return (
        <View style={[isWeb ? styles.marginTopMedium : null, containerStyle]}>
            <SettingsListBoolean
                leftIcon={bellIcon}
                iconBgColor={foodsAreaColor}
                title={translate(TranslationKeys.GET_NOTIFICATION_ON_AVAILABILITY)}
                isEnabled={isNotifyEnabled}
                onToggle={updateNotification}
                valueActive={translate(TranslationKeys.active)}
                valueInactive={translate(TranslationKeys.inactive)}
                showSeparator={false}
                groupPosition={isWeb ? "single" : "bottom"}
                isAccountRequired={isAccountRequired}
            />
        </View>
    );
};

export default memo(NotificationSection, (prevProps, nextProps) => {
    return (
        prevProps.theme === nextProps.theme &&
        prevProps.containerWidth === nextProps.containerWidth &&
        prevProps.previousFeedback === nextProps.previousFeedback &&
        prevProps.foodsAreaColor === nextProps.foodsAreaColor &&
        prevProps.isAccountRequired === nextProps.isAccountRequired
    );
});
