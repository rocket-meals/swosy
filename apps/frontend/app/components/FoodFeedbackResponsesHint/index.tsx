import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import { ChatHelper, DatabaseTypes, FoodFeedbackReactionHelper } from 'repo-depkit-common';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import { FoodFeedbackHelper } from '@/redux/actions/FoodFeedbacks/FoodFeedbacks';
import { ProfileHelper } from '@/redux/actions/Profile/Profile';
import { UserHelper } from '@/helper/UserHelper';
import { getFoodName } from '@/helper/resourceHelper';
import { persistChatReadStatus, syncChatReadUntilToServer } from '@/helper/chatReadStatus';
import useChatUnreadStatus, { getChatTimestamp } from '@/hooks/useChatUnreadStatus';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { MARK_CHAT_AS_READ, UPDATE_PROFILE } from '@/redux/Types/types';
import { TranslationKeys } from '@/locales/keys';

/** Comments are cut to this length in the details. */
const COMMENT_EXCERPT_LENGTH = 120;

type ThemeColors = { text: string; icon: string; placeholder: string; iconBg: string };

/** Opens a chat, or the list of chats when there are several. */
function openChats(chats: readonly DatabaseTypes.Chats[]) {
	if (chats.length === 1 && chats[0]) {
		router.push({ pathname: '/chats/details', params: { chat_id: chats[0].id } });
		return;
	}
	router.push('/chats');
}

function excerptOf(text: string | null | undefined): string | null {
	const trimmed = text?.trim();
	if (!trimmed) {
		return null;
	}
	return trimmed.length > COMMENT_EXCERPT_LENGTH ? `${trimmed.slice(0, COMMENT_EXCERPT_LENGTH).trimEnd()}…` : trimmed;
}

/** The details in the modal: every reaction with food and own comment, and the chats with a new message. */
const FoodFeedbackResponsesDetails: React.FC<{
	feedbacks: readonly DatabaseTypes.FoodsFeedbacks[];
	chats: readonly DatabaseTypes.Chats[];
	language: string;
	colors: ThemeColors;
	openChatLabel: string;
	newMessageLabel: string;
	onOpenChats: (chats: readonly DatabaseTypes.Chats[]) => void;
}> = ({ feedbacks, chats, language, colors, openChatLabel, newMessageLabel, onOpenChats }) => (
	<View style={styles.details}>
		{chats.map(chat => (
			<TouchableOpacity key={chat.id} style={[styles.detailRow, { backgroundColor: colors.iconBg }]} onPress={() => onOpenChats([chat])} accessibilityRole="button" accessibilityLabel={openChatLabel}>
				<MaterialCommunityIcons name="chat-processing-outline" size={26} color={colors.icon} />
				<View style={styles.detailText}>
					<Text style={[styles.detailTitle, { color: colors.text }]} numberOfLines={2}>
						{chat.alias || newMessageLabel}
					</Text>
					<Text style={[styles.detailSubtitle, { color: colors.placeholder }]}>{newMessageLabel}</Text>
				</View>
				<Octicons name="chevron-right" size={20} color={colors.icon} />
			</TouchableOpacity>
		))}
		{feedbacks.map(feedback => {
			const comment = excerptOf(feedback.comment);
			return (
				<View key={feedback.id} style={[styles.detailRow, { backgroundColor: colors.iconBg }]}>
					<Text style={styles.detailEmoji} accessibilityElementsHidden importantForAccessibility="no">
						{feedback.support_reaction}
					</Text>
					<View style={styles.detailText}>
						<Text style={[styles.detailTitle, { color: colors.text }]} numberOfLines={2}>
							{getFoodName(feedback.food as DatabaseTypes.Foods | null | undefined, language) ?? ''}
						</Text>
						{comment ? <Text style={[styles.detailSubtitle, { color: colors.placeholder }]}>{`„${comment}“`}</Text> : null}
					</View>
				</View>
			);
		})}
	</View>
);

/**
 * "Rückmeldung der Mensa zu deinem Kommentar", above the food offers. Shows, bundled, what came back
 * on the user's food feedbacks since they last looked, which can be days after the comment:
 * - new reactions of the canteen (`foods_feedbacks.support_reaction`) as e.g. 👍 3 😋 1,
 * - chats of food feedbacks with a new message.
 * A tap opens the details; the "x" hides it. Seen reactions are stored in
 * `profiles.food_feedback_reactions_seen_until` and chats are marked as read, both on the server, so
 * nothing comes back after a new login or on another device. Hidden for guests and when nothing is new.
 */
const FoodFeedbackResponsesHint: React.FC = () => {
	const { theme } = useTheme();
	const { translate, language } = useLanguage();
	const dispatch = useAppDispatch();
	const { show: showModal, close: closeModal } = useMyScrollViewModal();
	const { primaryColor } = useAppSelector(state => state.settings);
	const user = useAppSelector(state => state.authReducer.user);
	const profile = useAppSelector(state => state.authReducer.profile) as DatabaseTypes.Profiles | undefined;
	const { chats, readStatus, isChatUnread } = useChatUnreadStatus();
	const isAnonymousUser = useMemo(() => UserHelper.isAnonymousUser(user), [user]);
	const profileId = profile?.id;
	const seenUntil = profile?.food_feedback_reactions_seen_until ?? null;
	const [feedbacks, setFeedbacks] = useState<DatabaseTypes.FoodsFeedbacks[]>([]);

	const load = useCallback(async () => {
		if (!profileId || isAnonymousUser) {
			setFeedbacks([]);
			return;
		}
		try {
			const result = (await new FoodFeedbackHelper().fetchFoodFeedbacks(profileId, {
				fields: ['id', 'comment', 'support_reaction', 'support_reaction_date', 'food.id', 'food.alias', 'food.translations.*'],
				filter: FoodFeedbackReactionHelper.buildNewReactionsFilter(profileId, seenUntil),
				sort: ['-support_reaction_date'],
				limit: 50,
			})) as DatabaseTypes.FoodsFeedbacks[];
			setFeedbacks(result ?? []);
		} catch (error) {
			console.error('Loading the reactions to food feedbacks failed:', error);
		}
	}, [profileId, seenUntil, isAnonymousUser]);

	useEffect(() => {
		load();
		// A reaction can come in while the app is in the background.
		const subscription = AppState.addEventListener('change', state => {
			if (state === 'active') {
				load();
			}
		});
		return () => subscription.remove();
	}, [load]);

	const newFeedbacks = useMemo(() => feedbacks.filter(feedback => FoodFeedbackReactionHelper.isNewReaction(feedback, seenUntil)), [feedbacks, seenUntil]);
	const reactionCounts = useMemo(() => FoodFeedbackReactionHelper.groupReactions(newFeedbacks), [newFeedbacks]);
	const unreadChats = useMemo(() => (isAnonymousUser ? [] : chats.filter(chat => ChatHelper.isFoodFeedbackChat(chat) && isChatUnread(chat))), [chats, isChatUnread, isAnonymousUser]);
	const latestFoodName = newFeedbacks[0] ? getFoodName(newFeedbacks[0].food as DatabaseTypes.Foods | null | undefined, language) : null;

	const markReactionsSeen = useCallback(async () => {
		if (!profile?.id || newFeedbacks.length === 0) {
			return;
		}
		const nextSeenUntil = FoodFeedbackReactionHelper.getSeenUntilAfterClosing(newFeedbacks, seenUntil);
		dispatch({ type: UPDATE_PROFILE, payload: { ...profile, food_feedback_reactions_seen_until: nextSeenUntil } });
		try {
			await new ProfileHelper().updateProfile({ id: profile.id, food_feedback_reactions_seen_until: nextSeenUntil });
		} catch (error) {
			// Stays hidden on this device; shows again elsewhere until the next successful close.
			console.error('Saving the seen reactions to food feedbacks failed:', error);
		}
	}, [dispatch, profile, newFeedbacks, seenUntil]);

	const markChatsRead = useCallback(() => {
		const readUntil: Record<string, string> = {};
		for (const chat of unreadChats) {
			const timestamp = getChatTimestamp(chat);
			if (timestamp) {
				readUntil[chat.id] = timestamp;
				dispatch({ type: MARK_CHAT_AS_READ, payload: { chatId: chat.id, timestamp } });
			}
		}
		if (Object.keys(readUntil).length > 0) {
			void persistChatReadStatus({ ...readStatus, ...readUntil });
			void syncChatReadUntilToServer(chats, profile?.id, readUntil);
		}
	}, [dispatch, unreadChats, readStatus, chats, profile?.id]);

	const close = useCallback(() => {
		markChatsRead();
		void markReactionsSeen();
	}, [markChatsRead, markReactionsSeen]);

	const openFromModal = useCallback(
		(chatsToOpen: readonly DatabaseTypes.Chats[]) => {
			closeModal();
			openChats(chatsToOpen);
		},
		[closeModal]
	);

	/** The details; the reactions count as seen once they are shown there, the chats once opened. */
	const openDetails = useCallback(() => {
		showModal({
			title: translate(TranslationKeys.food_feedback_responses_modal_title),
			children: (
				<FoodFeedbackResponsesDetails
					feedbacks={newFeedbacks}
					chats={unreadChats}
					language={language}
					colors={theme.screen}
					openChatLabel={translate(TranslationKeys.food_feedback_responses_open_chat)}
					newMessageLabel={translate(TranslationKeys.food_feedback_responses_new_message)}
					onOpenChats={openFromModal}
				/>
			),
		});
		void markReactionsSeen();
	}, [showModal, translate, newFeedbacks, unreadChats, language, theme.screen, openFromModal, markReactionsSeen]);

	if (reactionCounts.length === 0 && unreadChats.length === 0) {
		return null;
	}

	return (
		<TouchableOpacity
			style={[styles.container, { backgroundColor: theme.screen.iconBg, borderLeftColor: primaryColor }]}
			onPress={openDetails}
			accessibilityRole="button"
			accessibilityLabel={translate(TranslationKeys.food_feedback_responses_title)}
		>
			<View style={styles.header}>
				<MaterialCommunityIcons name="message-reply-text-outline" size={20} color={theme.screen.icon} />
				<Text style={[styles.title, { color: theme.screen.text }]}>{translate(TranslationKeys.food_feedback_responses_title)}</Text>
				<TouchableOpacity onPress={close} accessibilityRole="button" accessibilityLabel={translate(TranslationKeys.hide)} hitSlop={12}>
					<MaterialCommunityIcons name="close" size={20} color={theme.screen.icon} />
				</TouchableOpacity>
			</View>
			{reactionCounts.length > 0 && (
				<View style={styles.reactions}>
					{reactionCounts.map(({ reaction, count }) => (
						<View key={reaction} style={[styles.reactionChip, { backgroundColor: theme.screen.background }]}>
							<Text style={styles.reactionEmoji}>{reaction}</Text>
							{count > 1 && <Text style={[styles.reactionCount, { color: theme.screen.text }]}>{count}</Text>}
						</View>
					))}
					{latestFoodName ? (
						<Text style={[styles.latestFood, { color: theme.screen.placeholder }]} numberOfLines={1}>
							{latestFoodName}
						</Text>
					) : null}
				</View>
			)}
			{unreadChats.length > 0 && (
				<TouchableOpacity style={styles.chatRow} onPress={() => openChats(unreadChats)} accessibilityRole="button" accessibilityLabel={translate(TranslationKeys.food_feedback_responses_open_chat)}>
					<MaterialCommunityIcons name="chat-processing-outline" size={20} color={primaryColor} />
					<Text style={[styles.chatText, { color: theme.screen.text }]} numberOfLines={1}>
						{translate(TranslationKeys.food_feedback_responses_new_message)}
					</Text>
					<Octicons name="chevron-right" size={18} color={theme.screen.icon} />
				</TouchableOpacity>
			)}
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	container: {
		marginHorizontal: 10,
		marginTop: 12,
		marginBottom: 4,
		paddingVertical: 10,
		paddingHorizontal: 12,
		borderRadius: 12,
		borderLeftWidth: 4,
		gap: 8,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	title: {
		flex: 1,
		fontSize: 15,
		fontWeight: '600',
	},
	reactions: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	reactionChip: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 12,
	},
	reactionEmoji: {
		fontSize: 18,
	},
	reactionCount: {
		fontSize: 14,
		fontWeight: '600',
	},
	latestFood: {
		flex: 1,
		fontSize: 13,
		marginLeft: 4,
	},
	chatRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	chatText: {
		flex: 1,
		fontSize: 14,
	},
	details: {
		gap: 10,
		paddingBottom: 16,
	},
	detailRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		padding: 12,
		borderRadius: 12,
	},
	detailEmoji: {
		fontSize: 26,
	},
	detailText: {
		flex: 1,
		gap: 2,
	},
	detailTitle: {
		fontSize: 15,
		fontWeight: '600',
	},
	detailSubtitle: {
		fontSize: 13,
	},
});

export default FoodFeedbackResponsesHint;
