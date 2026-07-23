import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CustomTooltip, TooltipContent, TooltipText } from '@/components/CustomTooltip';
import IconButton from '@/components/UI/IconButton';
import { TranslationKeys } from '@/locales/keys';
import styles from '../styles';

interface DetailsHeaderProps {
    alias: string | null | undefined;
    screenWidth: number;
    theme: any;
    translate: (key: string) => string;
    onOpenNavigation: () => void;
}

const NavigationTriggerButton = ({
    triggerProps,
    onPress,
    backgroundColor,
    iconColor,
}: {
    triggerProps: object;
    onPress: () => void;
    backgroundColor: string;
    iconColor: string;
}) => (
    <IconButton {...triggerProps} onPress={onPress} style={{ ...styles.navigationButton, backgroundColor }}>
        <MaterialCommunityIcons name="navigation-variant" size={24} color={iconColor} />
    </IconButton>
);

// Factory returning a stable `trigger` render-prop for CustomTooltip, so no
// new function-that-returns-JSX is defined inside the parent component body.
function makeNavigationTrigger(onPress: () => void, backgroundColor: string, iconColor: string) {
    return (triggerProps: object) => (
        <NavigationTriggerButton triggerProps={triggerProps} onPress={onPress} backgroundColor={backgroundColor} iconColor={iconColor} />
    );
}

const DetailsHeader: React.FC<DetailsHeaderProps> = ({
    alias,
    screenWidth,
    theme,
    translate,
    onOpenNavigation,
}) => {
    return (
        <>
            <Text style={{ ...styles.buildingHeading, color: theme.screen.text }}>{alias}</Text>

            <View
                style={{
                    width: '98%',
                    flexDirection: 'row',
                    justifyContent: screenWidth > 900 ? 'flex-start' : 'flex-end',
                    gap: 10,
                }}
            >
                <CustomTooltip
                    placement="top"
                    trigger={makeNavigationTrigger(onOpenNavigation, theme.screen.iconBg, theme.screen.icon)}
                >
                    <TooltipContent bg={theme.tooltip.background} py="$1" px="$2">
                        <TooltipText fontSize="$sm" color={theme.tooltip.text}>
                            {`${translate(TranslationKeys.open_navitation_to_location)}`}
                        </TooltipText>
                    </TooltipContent>
                </CustomTooltip>
            </View>
        </>
    );
};

export default memo(DetailsHeader);
