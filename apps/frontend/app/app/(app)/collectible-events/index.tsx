import React, { useMemo } from 'react';
import { SafeAreaView, ScrollView, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

import SettingsList from '@/components/SettingsList';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import { getTitleFromTranslation } from '@/helper/resourceHelper';
import { RootState } from '@/redux/reducer';
import styles from './styles';

const getGroupPosition = (index: number, length: number) => {
        if (length === 1) return 'single';
        if (index === 0) return 'top';
        if (index === length - 1) return 'bottom';
        return 'middle';
};

const formatDateRange = (event: any) => {
        const startDate = event?.date_start;
        const endDate = event?.date_end;

        if (startDate && endDate) {
                return `${startDate} - ${endDate}`;
        }

        return startDate || endDate || undefined;
};

const CollectibleEventsScreen = () => {
        useSetPageTitle(TranslationKeys.collectible_events);
        const { theme } = useTheme();
        const { translate, language } = useLanguage();
        const { primaryColor } = useSelector((state: RootState) => state.settings);
        const { collectibleEvents } = useSelector((state: RootState) => state.collectibleEvents);

        const events = useMemo(() => collectibleEvents || [], [collectibleEvents]);
        const hasEvents = events.length > 0;

        return (
                <SafeAreaView style={{ flex: 1, backgroundColor: theme.screen.background }}>
                        <ScrollView contentContainerStyle={styles.container}>
                                {hasEvents ? (
                                        events.map((event: any, index: number) => (
                                                <SettingsList
                                                        key={event.id || index}
                                                        iconBgColor={primaryColor}
                                                        leftIcon={
                                                                <MaterialCommunityIcons
                                                                        name="trophy-outline"
                                                                        size={24}
                                                                        color={theme.screen.icon}
                                                                />
                                                        }
                                                        label={
                                                                event?.translations
                                                                        ? getTitleFromTranslation(event.translations as any, language)
                                                                        : event?.alias || translate(TranslationKeys.collectible_event)
                                                        }
                                                        value={formatDateRange(event)}
                                                        groupPosition={getGroupPosition(index, events.length) as any}
                                                />
                                        ))
                                ) : (
                                        <Text style={{ ...styles.emptyText, color: theme.screen.text }}>
                                                {translate(TranslationKeys.nothing_found)}
                                        </Text>
                                )}
                        </ScrollView>
                </SafeAreaView>
        );
};

export default CollectibleEventsScreen;
