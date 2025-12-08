import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { DatabaseTypes } from 'repo-depkit-common';

import useActiveCollectibleEvent from '@/hooks/useActiveCollectibleEvent';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import { RootState } from '@/redux/reducer';
import { useSelector } from 'react-redux';
import { getDescriptionFromTranslation, getTitleFromTranslation } from '@/helper/resourceHelper';
import useToast from '@/hooks/useToast';
import styles from './styles';
import { CollectibleEventParticipantsHelper } from '@/redux/actions/CollectibleEvents/CollectibleEventParticipants';

const CollectibleEventScreen = () => {
        useSetPageTitle(TranslationKeys.collectible_event);

        const { theme } = useTheme();
        const toast = useToast();
        const { translate, language } = useLanguage();
        const { profile, loggedIn } = useSelector((state: RootState) => state.authReducer);
        const { primaryColor } = useSelector((state: RootState) => state.settings);
        const buttonColor = primaryColor || theme.primary;
        const { activeCollectibleEvent } = useActiveCollectibleEvent();
        const participantsHelper = useMemo(() => new CollectibleEventParticipantsHelper(), []);

        const [points, setPoints] = useState('');
        const [isLoading, setIsLoading] = useState(false);
        const [isSaving, setIsSaving] = useState(false);
        const [participation, setParticipation] = useState<DatabaseTypes.CollectibleEventParticipants | null>(null);

        const loadParticipation = useCallback(async () => {
                if (!activeCollectibleEvent?.id || !profile?.id) {
                        setParticipation(null);
                        setPoints('');
                        return;
                }

                setIsLoading(true);
                try {
                        const existing = await participantsHelper.fetchParticipationByProfileAndEvent(
                                profile.id,
                                activeCollectibleEvent.id,
                                { fields: ['*'] }
                        );
                        if (existing) {
                                setParticipation(existing);
                                setPoints(existing.points ? String(existing.points) : '');
                        } else {
                                setParticipation(null);
                                setPoints('');
                        }
                } catch (error) {
                        console.error('Error fetching collectible event participation:', error);
                        toast(translate(TranslationKeys.collectible_event_load_error), 'error');
                } finally {
                        setIsLoading(false);
                }
        }, [activeCollectibleEvent?.id, participantsHelper, profile?.id, toast, translate]);

        useEffect(() => {
                loadParticipation();
        }, [loadParticipation]);

        const handleSave = async () => {
                if (!activeCollectibleEvent?.id) {
                        toast(translate(TranslationKeys.collectible_event_no_active), 'error');
                        return;
                }

                if (!loggedIn || !profile?.id) {
                        toast(translate(TranslationKeys.collectible_event_login_required), 'error');
                        return;
                }

                setIsSaving(true);
                try {
                        const payload: Partial<DatabaseTypes.CollectibleEventParticipants> = {
                                points: points?.toString() ?? '',
                                profile: profile.id,
                                collectible_event: activeCollectibleEvent.id,
                                status: 'published',
                        };

                        const updated = participation?.id
                                ? await participantsHelper.updateItem(participation.id, payload)
                                : await participantsHelper.createItem(payload);

                        setParticipation(updated as DatabaseTypes.CollectibleEventParticipants);
                        setPoints((updated as DatabaseTypes.CollectibleEventParticipants)?.points || points);
                        toast(translate(TranslationKeys.collectible_event_save_success), 'success');
                } catch (error) {
                        console.error('Error saving collectible event participation:', error);
                        toast(translate(TranslationKeys.collectible_event_save_error), 'error');
                } finally {
                        setIsSaving(false);
                }
        };

        const renderContent = () => {
                if (!activeCollectibleEvent) {
                        return <Text style={{ ...styles.info, color: theme.screen.text }}>{translate(TranslationKeys.collectible_event_no_active)}</Text>;
                }

                const title =
                        getTitleFromTranslation(activeCollectibleEvent.translations as any, language) || activeCollectibleEvent.alias || '';
                const description = getDescriptionFromTranslation(activeCollectibleEvent.translations as any, language);

                return (
                        <View style={[styles.card, { backgroundColor: theme.background, borderColor: theme.screen.icon }]}>
                                <Text style={{ ...styles.title, color: theme.screen.text }}>{title}</Text>
                                {description ? (
                                        <Text style={{ ...styles.description, color: theme.inactiveText }}>{description}</Text>
                                ) : null}

                                <View style={{ marginTop: 16 }}>
                                        <Text style={{ ...styles.label, color: theme.screen.text }}>
                                                {translate(TranslationKeys.collectible_event_points)}
                                        </Text>
                                        <TextInput
                                                style={{
                                                        ...styles.input,
                                                        color: theme.screen.text,
                                                        backgroundColor: theme.drawerBg,
                                                        borderColor: theme.screen.icon,
                                                }}
                                                value={points}
                                                onChangeText={setPoints}
                                                placeholder={translate(TranslationKeys.enter_number)}
                                                placeholderTextColor={theme.screen.placeholder}
                                                keyboardType="numeric"
                                                inputMode="numeric"
                                        />
                                </View>

                                <TouchableOpacity
                                        style={{
                                                ...styles.button,
                                                backgroundColor: buttonColor,
                                                opacity: isSaving ? 0.6 : 1,
                                        }}
                                        disabled={isSaving}
                                        onPress={handleSave}
                                >
                                        <Text style={{ ...styles.buttonText, color: theme.dark }}>
                                                {isSaving
                                                        ? translate(TranslationKeys.loading)
                                                        : translate(TranslationKeys.save)}
                                        </Text>
                                </TouchableOpacity>

                                {isLoading ? (
                                        <View style={[styles.inline, { justifyContent: 'flex-start' }]}>
                                                <ActivityIndicator color={buttonColor} />
                                                <Text style={{ color: theme.screen.text, marginLeft: 8 }}>
                                                        {translate(TranslationKeys.collectible_event_loading_participation)}
                                                </Text>
                                        </View>
                                ) : null}
                        </View>
                );
        };

        return (
                <SafeAreaView style={[styles.container, { backgroundColor: theme.screen.background }]}>
                        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                                {renderContent()}
                        </ScrollView>
                </SafeAreaView>
        );
};

export default CollectibleEventScreen;
