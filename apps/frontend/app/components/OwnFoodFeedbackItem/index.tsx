import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons, MaterialIcons, Octicons } from '@expo/vector-icons';
import { DatabaseTypes, FoodFeedbackReactionHelper, RatingHelper, RelationHelper } from 'repo-depkit-common';
import MyImage from '@/components/MyImage';
import { getFoodName } from '@/helper/resourceHelper';
import useChatUnreadStatus from '@/hooks/useChatUnreadStatus';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { useAppSelector } from '@/redux/hooks';
import { myContrastColor } from '@/helper/ColorHelper';
import { TranslationKeys } from '@/locales/keys';

export type OwnFoodFeedbackItemProps = {
	/** An own food feedback with `food` loaded (id, alias, image, image_remote_url, translations) and `chat` as id. */
	feedback: DatabaseTypes.FoodsFeedbacks;
	/** Opens the food; without it the card is not pressable. */
	onPress?: () => void;
	/** Shows the bell as a button to switch the notification on or off; without it, only an active bell is shown. */
	onToggleNotify?: () => void;
	/** Called before the chat opens, e.g. to close the modal the card is shown in. */
	onBeforeOpenChat?: () => void;
};

const STARS = Array.from({ length: RatingHelper.MAX_RATING }, (_, index) => index + 1);

/**
 * One own food feedback as a card, read like a short conversation:
 * - on top the food (picture, name) and the notification bell,
 * - "Von dir": the own stars and the own comment,
 * - "Von der Mensa": the reaction of the canteen and the button to the chat, when there is one
 *   (with a dot while it has a new message).
 * Used by the screen of the own ratings and notifications and by the hint above the food offers.
 */
const OwnFoodFeedbackItem: React.FC<OwnFoodFeedbackItemProps> = ({ feedback, onPress, onToggleNotify, onBeforeOpenChat }) => {
	const { theme } = useTheme();
	const { translate, language } = useLanguage();
	const { primaryColor, selectedTheme } = useAppSelector(state => state.settings);
	/** Text and icons on the primary color, e.g. the button to the chat and the active bell. */
	const onPrimaryColor = myContrastColor(primaryColor, theme, selectedTheme === 'dark');
	const { chats, isChatUnread } = useChatUnreadStatus();
	const food = typeof feedback.food === 'object' && feedback.food !== null ? (feedback.food as DatabaseTypes.Foods) : null;
	const imageUrl = food?.image_remote_url || undefined;
	const imageAssetId = !imageUrl && food?.image ? String(RelationHelper.getId(food.image as never) ?? '') : undefined;
	const comment = feedback.comment?.trim();
	const rating = typeof feedback.rating === 'number' ? feedback.rating : null;
	const hasOwnPart = rating !== null || !!comment;
	const hasReaction = FoodFeedbackReactionHelper.hasReaction(feedback);
	const chatId = RelationHelper.getId(feedback.chat as never);
	const chat = chatId ? chats.find(entry => String(entry.id) === String(chatId)) : undefined;
	const chatUnread = chat ? isChatUnread(chat) : false;
	const hasCanteenPart = hasReaction || !!chatId;

	const content = (
		<>
			<View style={styles.header}>
				<MyImage remote_image_url={imageUrl} directus_asset_id={imageAssetId || undefined} style={styles.image} contentFit="cover" />
				<Text style={[styles.foodName, { color: theme.screen.text }]} numberOfLines={3}>
					{getFoodName(food, language) ?? ''}
				</Text>
				{onToggleNotify ? (
					<TouchableOpacity
						onPress={onToggleNotify}
						style={[styles.bell, { borderColor: primaryColor }, feedback.notify ? { backgroundColor: primaryColor } : null]}
						accessibilityRole="switch"
						accessibilityState={{ checked: !!feedback.notify }}
						accessibilityLabel={translate(TranslationKeys.notification)}
						hitSlop={6}
					>
						<MaterialIcons name={feedback.notify ? 'notifications-active' : 'notifications-none'} size={22} color={feedback.notify ? onPrimaryColor : theme.screen.icon} />
					</TouchableOpacity>
				) : (
					feedback.notify && <MaterialIcons name="notifications-active" size={22} color={primaryColor} />
				)}
			</View>

			{hasOwnPart && (
				<View style={styles.section}>
					<Text style={[styles.sectionLabel, { color: theme.screen.placeholder }]}>{translate(TranslationKeys.own_food_feedback_from_you)}</Text>
					<View style={[styles.bubble, styles.ownBubble, { backgroundColor: theme.screen.background, borderLeftColor: primaryColor }]}>
						{rating !== null && (
							<View style={styles.stars} accessible accessibilityLabel={`${rating}/${RatingHelper.MAX_RATING}`}>
								{STARS.map(star => (
									<MaterialCommunityIcons key={star} name={star <= rating ? 'star' : 'star-outline'} size={20} color={star <= rating ? primaryColor : theme.screen.placeholder} />
								))}
							</View>
						)}
						{comment ? <Text style={[styles.comment, { color: theme.screen.text }]}>{`„${comment}“`}</Text> : null}
					</View>
				</View>
			)}

			{hasCanteenPart ? (
				<View style={styles.section}>
					<Text style={[styles.sectionLabel, { color: theme.screen.placeholder }]}>{translate(TranslationKeys.own_food_feedback_from_canteen)}</Text>
					<View style={[styles.bubble, styles.canteenBubble, { backgroundColor: theme.screen.background }]}>
						{hasReaction ? (
							<Text style={styles.reaction} accessibilityElementsHidden importantForAccessibility="no">
								{feedback.support_reaction}
							</Text>
						) : (
							<View />
						)}
						{chatId ? (
							<TouchableOpacity
								onPress={() => {
									onBeforeOpenChat?.();
									router.push({ pathname: '/chats/details', params: { chat_id: String(chatId) } });
								}}
								style={[styles.chatButton, { backgroundColor: primaryColor }]}
								accessibilityRole="button"
								accessibilityLabel={translate(TranslationKeys.food_feedback_responses_open_chat)}
							>
								<MaterialCommunityIcons name="chat-processing-outline" size={18} color={onPrimaryColor} />
								<Text style={[styles.chatButtonText, { color: onPrimaryColor }]}>{translate(TranslationKeys.food_feedback_responses_open_chat)}</Text>
								{chatUnread && <View style={[styles.unreadDot, { borderColor: onPrimaryColor }]} />}
								<Octicons name="chevron-right" size={16} color={onPrimaryColor} />
							</TouchableOpacity>
						) : null}
					</View>
				</View>
			) : (
				!!comment && <Text style={[styles.noResponse, { color: theme.screen.placeholder }]}>{translate(TranslationKeys.own_food_feedback_no_response)}</Text>
			)}
		</>
	);

	return onPress ? (
		<TouchableOpacity style={[styles.card, { backgroundColor: theme.screen.iconBg }]} onPress={onPress} activeOpacity={0.8}>
			{content}
		</TouchableOpacity>
	) : (
		<View style={[styles.card, { backgroundColor: theme.screen.iconBg }]}>{content}</View>
	);
};

const styles = StyleSheet.create({
	card: {
		borderRadius: 16,
		padding: 14,
		gap: 12,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	image: {
		width: 64,
		height: 64,
		borderRadius: 12,
	},
	foodName: {
		flex: 1,
		fontSize: 17,
		fontWeight: '600',
	},
	bell: {
		borderWidth: 1,
		borderRadius: 20,
		padding: 8,
	},
	section: {
		gap: 6,
	},
	sectionLabel: {
		fontSize: 12,
		fontWeight: '700',
		letterSpacing: 0.6,
		textTransform: 'uppercase',
	},
	bubble: {
		borderRadius: 12,
		paddingVertical: 10,
		paddingHorizontal: 12,
		gap: 6,
	},
	ownBubble: {
		borderLeftWidth: 4,
	},
	canteenBubble: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 12,
	},
	stars: {
		flexDirection: 'row',
		gap: 2,
	},
	comment: {
		fontSize: 15,
		lineHeight: 21,
		fontStyle: 'italic',
	},
	reaction: {
		fontSize: 30,
	},
	chatButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 20,
	},
	chatButtonText: {
		fontSize: 14,
		fontWeight: '600',
	},
	unreadDot: {
		width: 10,
		height: 10,
		borderRadius: 5,
		backgroundColor: '#FF3B30',
		borderWidth: 1,
	},
	noResponse: {
		fontSize: 13,
		fontStyle: 'italic',
	},
});

export default OwnFoodFeedbackItem;
