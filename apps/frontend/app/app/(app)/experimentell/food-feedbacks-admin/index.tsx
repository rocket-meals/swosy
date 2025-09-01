import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import styles from './styles';
import { FoodFeedbackHelper } from '@/redux/actions/FoodFeedbacks/FoodFeedbacks';
import { DatabaseTypes } from 'repo-depkit-common';
import SettingsList from '@/components/SettingsList';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ChatsHelper } from '@/redux/actions/Chats/Chats';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducer';
import { SET_CHATS } from '@/redux/Types/types';
import { router } from 'expo-router';

const FoodFeedbacksAdmin = () => {
        useSetPageTitle(TranslationKeys.food_feedbacks);
        const { theme } = useTheme();
        const { translate } = useLanguage();
        const dispatch = useDispatch();
        const chats = useSelector((state: RootState) => state.chats.chats);
        const { profile } = useSelector((state: RootState) => state.authReducer);
        const [loading, setLoading] = useState(false);
        const [feedbacks, setFeedbacks] = useState<DatabaseTypes.FoodsFeedbacks[]>([]);

        const feedbackHelper = useMemo(() => new FoodFeedbackHelper(), []);
        const chatsHelper = useMemo(() => new ChatsHelper(), []);

        const fetchFeedbacks = async () => {
                try {
                        setLoading(true);
                        const result = (await feedbackHelper.fetchAllFoodFeedbacks({
                                sort: ['-date_created'],
                                filter: { status: { _eq: 'published' } },
                        })) as DatabaseTypes.FoodsFeedbacks[];
                        setFeedbacks(result);
                } catch (e) {
                        console.error('Error fetching feedbacks:', e);
                } finally {
                        setLoading(false);
                }
        };

        useEffect(() => {
                fetchFeedbacks();
        }, []);

        const openChat = async (feedback: DatabaseTypes.FoodsFeedbacks) => {
                try {
                        let existing = chats.find(c => c.foods_feedback === feedback.id);
                        if (!existing) {
                                const newChat = (await chatsHelper.createItem({
                                        foods_feedback: feedback.id,
                                        status: 'published',
                                        participants: [
                                                { profiles_id: profile?.id },
                                                { profiles_id: feedback.profile as string },
                                        ],
                                })) as DatabaseTypes.Chats;
                                if (newChat) {
                                        dispatch({ type: SET_CHATS, payload: [...chats, newChat] });
                                        existing = newChat;
                                }
                        }
                        if (existing) {
                                router.push({ pathname: '/chats/details', params: { chat_id: existing.id } });
                        }
                } catch (e) {
                        console.error('Error creating chat:', e);
                }
        };

        return (
                <ScrollView
                        style={{ ...styles.container, backgroundColor: theme.screen.background }}
                        contentContainerStyle={{ ...styles.contentContainer, backgroundColor: theme.screen.background }}
                >
                        <View style={styles.content}>
                                <Text style={{ ...styles.heading, color: theme.screen.text }}>{translate(TranslationKeys.food_feedbacks)}</Text>
                                {loading ? (
                                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                                                <ActivityIndicator size="large" color={theme.screen.text} />
                                        </View>
                                ) : (
                                        feedbacks.map((item, index) => (
                                                <SettingsList
                                                        key={item.id}
                                                        leftIcon={<MaterialCommunityIcons name="comment-text" size={24} color={theme.screen.icon} />}
                                                        title={item.comment || '-'}
                                                        value={item.rating ? String(item.rating) : undefined}
                                                        rightIcon={<MaterialCommunityIcons name="chat-plus" size={24} color={theme.screen.icon} />}
                                                        onPress={() => openChat(item)}
                                                        groupPosition={
                                                                feedbacks.length === 1
                                                                        ? 'single'
                                                                        : index === 0
                                                                                ? 'top'
                                                                                : index === feedbacks.length - 1
                                                                                        ? 'bottom'
                                                                                        : 'middle'
                                                        }
                                                />
                                        ))
                                )}
                        </View>
                </ScrollView>
        );
};

export default FoodFeedbacksAdmin;

