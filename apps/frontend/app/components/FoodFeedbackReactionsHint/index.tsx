import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DatabaseTypes, FoodFeedbackReaction, FoodFeedbackReactionHelper } from 'repo-depkit-common';
import { FoodFeedbackHelper } from '@/redux/actions/FoodFeedbacks/FoodFeedbacks';
import { ProfileHelper } from '@/redux/actions/Profile/Profile';
import { UserHelper } from '@/helper/UserHelper';
import { getFoodName } from '@/helper/resourceHelper';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { UPDATE_PROFILE } from '@/redux/Types/types';
import { TranslationKeys } from '@/locales/keys';

/** At most this many reactions are listed, the rest is summed up as "+n". */
const MAX_VISIBLE_REACTIONS = 3;

const REACTION_LABEL_KEYS: Record<FoodFeedbackReaction, TranslationKeys> = {
	[FoodFeedbackReaction.THUMBS_UP]: TranslationKeys.food_feedback_reaction_thumbs_up,
	[FoodFeedbackReaction.HEART]: TranslationKeys.food_feedback_reaction_heart,
	[FoodFeedbackReaction.THANKS]: TranslationKeys.food_feedback_reaction_thanks,
	[FoodFeedbackReaction.YUMMY]: TranslationKeys.food_feedback_reaction_yummy,
	[FoodFeedbackReaction.GOOD_IDEA]: TranslationKeys.food_feedback_reaction_good_idea,
};

/**
 * "Die Mensa hat auf dein Feedback reagiert": shown above the food offers once support reacted to a
 * food feedback of the user (`foods_feedbacks.support_reaction`), which can be days after the feedback.
 * Closing it stores the newest reaction shown in `profiles.food_feedback_reactions_seen_until`, so it
 * does not come back after a new login or on another device. Hidden for guests and without reactions.
 */
const FoodFeedbackReactionsHint: React.FC = () => {
	const { theme } = useTheme();
	const { translate, language } = useLanguage();
	const dispatch = useAppDispatch();
	const { primaryColor } = useAppSelector(state => state.settings);
	const user = useAppSelector(state => state.authReducer.user);
	const profile = useAppSelector(state => state.authReducer.profile) as DatabaseTypes.Profiles | undefined;
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
				fields: ['id', 'support_reaction', 'support_reaction_date', 'food.id', 'food.alias', 'food.translations.*'],
				filter: FoodFeedbackReactionHelper.buildNewReactionsFilter(profileId, seenUntil),
				sort: ['-support_reaction_date'],
				limit: 20,
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

	const close = useCallback(async () => {
		if (!profile?.id) {
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

	if (newFeedbacks.length === 0) {
		return null;
	}

	const visible = newFeedbacks.slice(0, MAX_VISIBLE_REACTIONS);
	const hiddenCount = newFeedbacks.length - visible.length;

	return (
		<View style={[styles.container, { backgroundColor: theme.screen.iconBg, borderLeftColor: primaryColor }]} accessibilityRole="summary">
			<View style={styles.header}>
				<MaterialCommunityIcons name="message-reply-text-outline" size={20} color={theme.screen.icon} />
				<Text style={[styles.title, { color: theme.screen.text }]}>{translate(TranslationKeys.food_feedback_reactions_title)}</Text>
				<TouchableOpacity onPress={close} accessibilityRole="button" accessibilityLabel={translate(TranslationKeys.hide)} hitSlop={12}>
					<MaterialCommunityIcons name="close" size={20} color={theme.screen.icon} />
				</TouchableOpacity>
			</View>
			{visible.map(feedback => {
				const reaction = FoodFeedbackReactionHelper.getReaction(feedback);
				const foodName = getFoodName(feedback.food as DatabaseTypes.Foods | null | undefined, language);
				return (
					<View key={feedback.id} style={styles.row}>
						<Text style={styles.emoji} accessibilityElementsHidden importantForAccessibility="no">
							{feedback.support_reaction}
						</Text>
						<View style={styles.rowText}>
							{foodName ? (
								<Text style={[styles.foodName, { color: theme.screen.text }]} numberOfLines={1}>
									{foodName}
								</Text>
							) : null}
							{reaction ? <Text style={[styles.reactionLabel, { color: theme.screen.placeholder }]}>{translate(REACTION_LABEL_KEYS[reaction])}</Text> : null}
						</View>
					</View>
				);
			})}
			{hiddenCount > 0 && <Text style={[styles.more, { color: theme.screen.placeholder }]}>{`+${hiddenCount}`}</Text>}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		width: '100%',
		maxWidth: 560,
		alignSelf: 'center',
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
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	emoji: {
		fontSize: 22,
	},
	rowText: {
		flex: 1,
	},
	foodName: {
		fontSize: 14,
	},
	reactionLabel: {
		fontSize: 12,
	},
	more: {
		fontSize: 12,
		marginLeft: 32,
	},
});

export default FoodFeedbackReactionsHint;
