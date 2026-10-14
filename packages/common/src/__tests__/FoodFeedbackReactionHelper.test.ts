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

  describe('new reactions for the author', () => {
    const now = new Date('2026-10-14T12:00:00.000Z');

    it('counts reactions after seen-until as new, but never older than the max age', () => {
      expect(FoodFeedbackReactionHelper.getNewSince('2026-10-13T08:00:00.000Z', now)).toBe('2026-10-13T08:00:00.000Z');
      expect(FoodFeedbackReactionHelper.getNewSince(null, now)).toBe('2026-09-30T12:00:00.000Z');
      expect(FoodFeedbackReactionHelper.getNewSince('2026-01-01T00:00:00.000Z', now)).toBe('2026-09-30T12:00:00.000Z');
      expect(FoodFeedbackReactionHelper.getNewSince('not a date', now)).toBe('2026-09-30T12:00:00.000Z');
    });

    it('filters the own feedbacks with a reaction after that date', () => {
      expect(FoodFeedbackReactionHelper.buildNewReactionsFilter('p1', '2026-10-13T08:00:00.000Z', now)).toEqual({
        _and: [{ profile: { _eq: 'p1' } }, { support_reaction: { _nempty: true } }, { support_reaction_date: { _gt: '2026-10-13T08:00:00.000Z' } }],
      });
    });

    it('agrees in memory', () => {
      const seen = '2026-10-13T08:00:00.000Z';
      expect(FoodFeedbackReactionHelper.isNewReaction({ support_reaction: '👍', support_reaction_date: '2026-10-14T09:00:00.000Z' }, seen, now)).toBe(true);
      expect(FoodFeedbackReactionHelper.isNewReaction({ support_reaction: '👍', support_reaction_date: seen }, seen, now)).toBe(false);
      expect(FoodFeedbackReactionHelper.isNewReaction({ support_reaction: null, support_reaction_date: '2026-10-14T09:00:00.000Z' }, seen, now)).toBe(false);
      expect(FoodFeedbackReactionHelper.isNewReaction({ support_reaction: '👍', support_reaction_date: null }, seen, now)).toBe(false);
    });

    it('remembers the newest reaction shown as seen, never going back', () => {
      const shown = [{ support_reaction_date: '2026-10-14T09:00:00.000Z' }, { support_reaction_date: '2026-10-14T10:00:00.000Z' }];
      expect(FoodFeedbackReactionHelper.getSeenUntilAfterClosing(shown, '2026-10-13T08:00:00.000Z')).toBe('2026-10-14T10:00:00.000Z');
      expect(FoodFeedbackReactionHelper.getSeenUntilAfterClosing([{ support_reaction_date: '2026-10-01T00:00:00.000Z' }], '2026-10-13T08:00:00.000Z')).toBe('2026-10-13T08:00:00.000Z');
      expect(FoodFeedbackReactionHelper.getSeenUntilAfterClosing([], null)).toBeNull();
    });
  });

  it('bundles reactions, most frequent first, ties by the latest', () => {
    expect(
      FoodFeedbackReactionHelper.groupReactions([
        { support_reaction: '😋', support_reaction_date: '2026-10-14T10:00:00.000Z' },
        { support_reaction: '👍', support_reaction_date: '2026-10-13T10:00:00.000Z' },
        { support_reaction: '👍', support_reaction_date: '2026-10-12T10:00:00.000Z' },
        { support_reaction: '🙏', support_reaction_date: '2026-10-11T10:00:00.000Z' },
        { support_reaction: null },
      ])
    ).toEqual([
      { reaction: '👍', count: 2 },
      { reaction: '😋', count: 1 },
      { reaction: '🙏', count: 1 },
    ]);
    expect(FoodFeedbackReactionHelper.groupReactions([])).toEqual([]);
  });

  it('only announces things of the last days in the hint', () => {
    const now = new Date('2026-10-14T12:00:00.000Z');
    expect(FoodFeedbackReactionHelper.isWithinHintWindow('2026-10-13T12:00:00.000Z', now)).toBe(true);
    expect(FoodFeedbackReactionHelper.isWithinHintWindow('2026-09-30T11:00:00.000Z', now)).toBe(false);
    expect(FoodFeedbackReactionHelper.isWithinHintWindow(null, now)).toBe(false);
    expect(FoodFeedbackReactionHelper.isWithinHintWindow('not a date', now)).toBe(false);
  });
});
