import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { TranslationKeys } from '@/locales/keys';
import { useActiveCollectibleEvent } from '@/hooks/useActiveCollectibleEvent';
import { useLanguage } from '@/hooks/useLanguage';

const CollectibleEventMonitor = () => {
        useSetPageTitle(TranslationKeys.collectible_event_monitor);
        const { theme } = useTheme();
        const { translate } = useLanguage();
        const { activeCollectibleEvent } = useActiveCollectibleEvent();

        const jsonString = useMemo(
                () => JSON.stringify(activeCollectibleEvent ?? null, null, 2),
                [activeCollectibleEvent]
        );

        return (
                <ScrollView
                        style={{ ...styles.container, backgroundColor: theme.screen.background }}
                        contentContainerStyle={{ ...styles.contentContainer, backgroundColor: theme.screen.background }}
                >
                        <Text style={{ ...styles.heading, color: theme.screen.text }}>
                                {translate(TranslationKeys.collectible_event_monitor)}
                        </Text>
                        <View style={{ ...styles.card, backgroundColor: theme.screen.iconBg }}>
                                <Text style={{ ...styles.code, color: theme.screen.text }}>{jsonString}</Text>
                        </View>
                </ScrollView>
        );
};

export default CollectibleEventMonitor;
