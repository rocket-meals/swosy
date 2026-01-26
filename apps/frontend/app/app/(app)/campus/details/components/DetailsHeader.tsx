import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tooltip, TooltipContent, TooltipText } from '@gluestack-ui/themed';
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
                <Tooltip
                    placement="top"
                    trigger={triggerProps => (
                        <IconButton
                            {...triggerProps}
                            onPress={onOpenNavigation}
                            style={{ ...styles.navigationButton, backgroundColor: theme.screen.iconBg }}
                        >
                            <MaterialCommunityIcons name="navigation-variant" size={24} color={theme.screen.icon} />
                        </IconButton>
                    )}
                >
                    <TooltipContent bg={theme.tooltip.background} py="$1" px="$2">
                        <TooltipText fontSize="$sm" color={theme.tooltip.text}>
                            {`${translate(TranslationKeys.open_navitation_to_location)}`}
                        </TooltipText>
                    </TooltipContent>
                </Tooltip>
            </View>
        </>
    );
};

export default memo(DetailsHeader);
