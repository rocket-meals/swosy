/**
 * The reactions support can give to a food feedback (`foods_feedbacks.support_reaction`), e.g. a thumbs
 * up for praise that needs no chat. The value is the emoji itself, so the app can show it as it is.
 */
export enum FoodFeedbackReaction {
  THUMBS_UP = '👍',
  HEART = '❤️',
  THANKS = '🙏',
  YUMMY = '😋',
  GOOD_IDEA = '💡',
}

/** What is written to `foods_feedbacks` when the reaction changes. */
export type FoodFeedbackReactionUpdate = {
  support_reaction: FoodFeedbackReaction | null;
  support_reaction_date: string | null;
};

export class FoodFeedbackReactionHelper {
  /** Order in which reactions are offered; must match the choices of the field in the Directus snapshot. */
  public static readonly REACTIONS: readonly FoodFeedbackReaction[] = [FoodFeedbackReaction.THUMBS_UP, FoodFeedbackReaction.HEART, FoodFeedbackReaction.THANKS, FoodFeedbackReaction.YUMMY, FoodFeedbackReaction.GOOD_IDEA];

  /** The reaction offered first, without opening the menu. */
  public static readonly DEFAULT_REACTION = FoodFeedbackReaction.THUMBS_UP;

  static isReaction(value: unknown): value is FoodFeedbackReaction {
    return FoodFeedbackReactionHelper.REACTIONS.includes(value as FoodFeedbackReaction);
  }

  /** The reaction of a feedback, `null` when there is none or the value is unknown. */
  static getReaction(feedback: { support_reaction?: string | null } | null | undefined): FoodFeedbackReaction | null {
    const value = feedback?.support_reaction;
    return FoodFeedbackReactionHelper.isReaction(value) ? value : null;
  }

  /** Whether support reacted; any non-blank value counts, also one that was set by hand in Directus. */
  static hasReaction(feedback: { support_reaction?: string | null } | null | undefined): boolean {
    return (feedback?.support_reaction ?? '').trim().length > 0;
  }

  /**
   * Reactions older than this are never shown as new in the app, so an author who has not opened the
   * app for months (or the first app version with this hint) does not get a flood of old ones.
   */
  public static readonly NEW_REACTION_MAX_AGE_DAYS = 14;

  /** From when on a reaction counts as new: after `seenUntil` (profile), but never older than {@link NEW_REACTION_MAX_AGE_DAYS}. */
  static getNewSince(seenUntil: string | null | undefined, now: Date = new Date()): string {
    const oldest = new Date(now.getTime() - FoodFeedbackReactionHelper.NEW_REACTION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
    const seen = seenUntil ? new Date(seenUntil) : null;
    return seen && !Number.isNaN(seen.getTime()) && seen > oldest ? seen.toISOString() : oldest.toISOString();
  }

  /**
   * The Directus filter for the feedbacks of a profile with a reaction the author has not seen yet:
   * reacted after `profiles.food_feedback_reactions_seen_until` (see {@link getNewSince}).
   */
  static buildNewReactionsFilter(profileId: string, seenUntil: string | null | undefined, now: Date = new Date()): Record<string, unknown> {
    return {
      _and: [{ profile: { _eq: profileId } }, { support_reaction: { _nempty: true } }, { support_reaction_date: { _gt: FoodFeedbackReactionHelper.getNewSince(seenUntil, now) } }],
    };
  }

  /** Whether the author has not seen the reaction of a feedback yet; the in-memory counterpart of {@link buildNewReactionsFilter}. */
  static isNewReaction(feedback: { support_reaction?: string | null; support_reaction_date?: string | null }, seenUntil: string | null | undefined, now: Date = new Date()): boolean {
    if (!FoodFeedbackReactionHelper.hasReaction(feedback) || !feedback.support_reaction_date) {
      return false;
    }
    const reactedAt = new Date(feedback.support_reaction_date);
    return !Number.isNaN(reactedAt.getTime()) && reactedAt > new Date(FoodFeedbackReactionHelper.getNewSince(seenUntil, now));
  }

  /**
   * What to store as `profiles.food_feedback_reactions_seen_until` once the author closed the hint: the
   * newest reaction shown, not "now", so a reaction that came in meanwhile still shows up next time.
   * Never moves back behind `seenUntil`.
   */
  static getSeenUntilAfterClosing(shown: readonly { support_reaction_date?: string | null }[], seenUntil: string | null | undefined): string | null {
    const times = [seenUntil, ...shown.map(feedback => feedback.support_reaction_date)].map(value => (value ? new Date(value).getTime() : Number.NaN)).filter(time => !Number.isNaN(time));
    return times.length > 0 ? new Date(Math.max(...times)).toISOString() : null;
  }

  /** The fields to set a reaction (`null` removes it), with the date the app compares against. */
  static buildUpdate(reaction: FoodFeedbackReaction | null, now: Date = new Date()): FoodFeedbackReactionUpdate {
    return { support_reaction: reaction, support_reaction_date: reaction ? now.toISOString() : null };
  }
}
