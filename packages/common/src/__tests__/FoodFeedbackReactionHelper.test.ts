import { describe, expect, it } from '@jest/globals';
import { FoodFeedbackReaction, FoodFeedbackReactionHelper } from '../FoodFeedbackReactionHelper';

describe('FoodFeedbackReactionHelper', () => {
  it('offers thumbs up first and as default', () => {
    expect(FoodFeedbackReactionHelper.REACTIONS[0]).toBe(FoodFeedbackReaction.THUMBS_UP);
    expect(FoodFeedbackReactionHelper.DEFAULT_REACTION).toBe(FoodFeedbackReaction.THUMBS_UP);
  });

  it('offers every reaction once', () => {
    expect(new Set(FoodFeedbackReactionHelper.REACTIONS).size).toBe(Object.values(FoodFeedbackReaction).length);
  });

  it('only knows its own reactions', () => {
    expect(FoodFeedbackReactionHelper.isReaction('👍')).toBe(true);
    expect(FoodFeedbackReactionHelper.isReaction('🤷')).toBe(false);
    expect(FoodFeedbackReactionHelper.isReaction(null)).toBe(false);
  });

  it('reads the reaction of a feedback', () => {
    expect(FoodFeedbackReactionHelper.getReaction({ support_reaction: '❤️' })).toBe(FoodFeedbackReaction.HEART);
    expect(FoodFeedbackReactionHelper.getReaction({ support_reaction: 'unknown' })).toBeNull();
    expect(FoodFeedbackReactionHelper.getReaction({})).toBeNull();
    expect(FoodFeedbackReactionHelper.getReaction(null)).toBeNull();
  });

  it('counts any non-blank value as reaction', () => {
    expect(FoodFeedbackReactionHelper.hasReaction({ support_reaction: 'unknown' })).toBe(true);
    expect(FoodFeedbackReactionHelper.hasReaction({ support_reaction: ' ' })).toBe(false);
    expect(FoodFeedbackReactionHelper.hasReaction({ support_reaction: null })).toBe(false);
  });

  it('sets the date together with the reaction and clears both on removal', () => {
    const now = new Date('2026-10-14T10:00:00.000Z');
    expect(FoodFeedbackReactionHelper.buildUpdate(FoodFeedbackReaction.THANKS, now)).toEqual({ support_reaction: '🙏', support_reaction_date: '2026-10-14T10:00:00.000Z' });
    expect(FoodFeedbackReactionHelper.buildUpdate(null, now)).toEqual({ support_reaction: null, support_reaction_date: null });
  });
});
