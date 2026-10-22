import { PrimaryKey } from '@directus/types';
import { CollectionNames, DatabaseTypes, FoodFeedbackReaction, FoodFeedbackReactionHelper } from 'repo-depkit-common';
import { ContentTranslationHelper } from '../helpers/ContentTranslationHelper';
import { ItemsServiceHelper } from '../helpers/ItemsServiceHelper';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { PushNotificationHelper } from '../helpers/PushNotificationHelper';
import { BackendLanguageResolver, BackendTranslationKeys, ResolvedBackendLanguage } from '../helpers/translations';

const HELPER_NAME = 'FoodFeedbackReactionPush';

/** What the reaction says to the author, so the emoji alone does not have to explain itself. */
const BODY_KEYS: Record<FoodFeedbackReaction, BackendTranslationKeys> = {
  [FoodFeedbackReaction.THUMBS_UP]: BackendTranslationKeys.notification_food_feedback_reaction_thumbs_up,
  [FoodFeedbackReaction.HEART]: BackendTranslationKeys.notification_food_feedback_reaction_heart,
  [FoodFeedbackReaction.THANKS]: BackendTranslationKeys.notification_food_feedback_reaction_thanks,
  [FoodFeedbackReaction.YUMMY]: BackendTranslationKeys.notification_food_feedback_reaction_yummy,
  [FoodFeedbackReaction.GOOD_IDEA]: BackendTranslationKeys.notification_food_feedback_reaction_good_idea,
  [FoodFeedbackReaction.SAD]: BackendTranslationKeys.notification_food_feedback_reaction_sad,
  [FoodFeedbackReaction.HAPPY]: BackendTranslationKeys.notification_food_feedback_reaction_happy,
  [FoodFeedbackReaction.APPLAUSE]: BackendTranslationKeys.notification_food_feedback_reaction_applause,
  [FoodFeedbackReaction.CELEBRATE]: BackendTranslationKeys.notification_food_feedback_reaction_celebrate,
  [FoodFeedbackReaction.STAR]: BackendTranslationKeys.notification_food_feedback_reaction_star,
  [FoodFeedbackReaction.NOTED]: BackendTranslationKeys.notification_food_feedback_reaction_noted,
  [FoodFeedbackReaction.LOOKING_INTO]: BackendTranslationKeys.notification_food_feedback_reaction_looking_into,
  [FoodFeedbackReaction.WORKING_ON_IT]: BackendTranslationKeys.notification_food_feedback_reaction_working_on_it,
  [FoodFeedbackReaction.DONE]: BackendTranslationKeys.notification_food_feedback_reaction_done,
  [FoodFeedbackReaction.OOPS]: BackendTranslationKeys.notification_food_feedback_reaction_oops,
  [FoodFeedbackReaction.THINKING]: BackendTranslationKeys.notification_food_feedback_reaction_thinking,
};

export type FoodFeedbackReactionPushMessage = { title: string; body: string };

/**
 * The push to the author of a food feedback when the canteen reacted to it (`support_reaction`), like
 * the push for a chat answer: the food as title, the emoji with a short text as body, e.g.
 * "Currywurst" / "👍 Der Mensa gefällt dein Kommentar."
 */
export class FoodFeedbackReactionPush {
  /** The text for a reaction; a reaction set by hand in Directus gets the general one. */
  static getBodyKey(reaction: string): BackendTranslationKeys {
    return FoodFeedbackReactionHelper.isReaction(reaction) ? BODY_KEYS[reaction] : BackendTranslationKeys.notification_food_feedback_reaction_other;
  }

  /** Title and body in the language of the author; `null` when the feedback has no reaction. */
  static buildMessage(feedback: Pick<DatabaseTypes.FoodsFeedbacks, 'support_reaction' | 'food'>, language: ResolvedBackendLanguage): FoodFeedbackReactionPushMessage | null {
    const reaction = feedback.support_reaction?.trim();
    if (!reaction) {
      return null;
    }
    const food = typeof feedback.food === 'object' && feedback.food !== null ? feedback.food : null;
    const foodName = (food?.translations ? ContentTranslationHelper.getTranslation(food.translations as never, language.languageCode ?? '', 'name') : '') || food?.alias || '';
    return {
      title: foodName.trim() || language.translate(BackendTranslationKeys.notification_food_feedback_reaction_title),
      body: `${reaction} ${language.translate(FoodFeedbackReactionPush.getBodyKey(reaction))}`,
    };
  }

  /** Sends the push for each feedback that has a reaction to all devices of its author. Best effort. */
  static async notifyAuthors(myDatabaseHelper: MyDatabaseHelper, feedbackIds: PrimaryKey[]): Promise<number> {
    if (feedbackIds.length === 0) {
      return 0;
    }
    const feedbacks = await myDatabaseHelper.getItemsServiceHelper<DatabaseTypes.FoodsFeedbacks>(CollectionNames.FOODS_FEEDBACKS).readMany(feedbackIds, {
      fields: ['id', 'profile', 'support_reaction', 'food.id', 'food.alias', 'food.translations.*'],
    });
    const languageResolver = new BackendLanguageResolver(myDatabaseHelper);
    const sent = { count: 0 };
    for (const feedback of feedbacks) {
      try {
        if (await FoodFeedbackReactionPush.notifyAuthor(myDatabaseHelper, languageResolver, feedback)) { // NOSONAR S9382 - sequential on purpose: per author DB reads and one push notification row, bounded DB load
          sent.count++;
        }
      } catch (error) {
        console.error(`${HELPER_NAME}: Failed to send the push about the reaction to food feedback ${feedback.id}`, error);
      }
    }
    return sent.count;
  }

  /** Whether a push was sent: not without author, reaction or a device that can receive pushes. */
  private static async notifyAuthor(myDatabaseHelper: MyDatabaseHelper, languageResolver: BackendLanguageResolver, feedback: DatabaseTypes.FoodsFeedbacks): Promise<boolean> {
    const profileId = ItemsServiceHelper.getPrimaryKeyFromItemOrString(feedback.profile);
    if (!profileId || !FoodFeedbackReactionHelper.hasReaction(feedback)) {
      return false;
    }
    const devices = await myDatabaseHelper.getDevicesHelper().readManyByProfileId(profileId);
    const expoPushTokens = PushNotificationHelper.getExpoPushTokensFromDevices(devices);
    if (expoPushTokens.length === 0) {
      return false;
    }
    const profile = await myDatabaseHelper.getProfilesHelper().readOne(profileId).catch(() => undefined);
    const message = FoodFeedbackReactionPush.buildMessage(feedback, await languageResolver.resolveForProfile(profile));
    if (!message) {
      return false;
    }
    await myDatabaseHelper.getPushNotificationsHelper().createOne({
      expo_push_tokens: expoPushTokens,
      message_title: message.title,
      message_body: message.body,
      // Like the push of a chat answer: the app icon shows a badge until the app is opened.
      ios_badge_count: 1,
    });
    return true;
  }
}
