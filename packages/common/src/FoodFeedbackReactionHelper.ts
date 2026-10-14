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

  /** The fields to set a reaction (`null` removes it), with the date the app compares against. */
  static buildUpdate(reaction: FoodFeedbackReaction | null, now: Date = new Date()): FoodFeedbackReactionUpdate {
    return { support_reaction: reaction, support_reaction_date: reaction ? now.toISOString() : null };
  }
}
