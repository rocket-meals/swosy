import { describe, expect, it } from '@jest/globals';
import { FoodFeedbackPermissionHelper } from 'repo-depkit-common';

import { findGuestFoodFeedbackViolation } from '../GuestFoodFeedbackRestriction';
import { BackendTranslationKeys } from '../../helpers/translations';

const nothingAllowed = FoodFeedbackPermissionHelper.getPermissions({ foods_ratings_type_for_unverified: 'disabled', foods_feedbacks_comments_type_for_unverified: 'read' }, true);
const everythingAllowed = FoodFeedbackPermissionHelper.getPermissions({ foods_ratings_type_for_unverified: 'inherit', foods_feedbacks_comments_type_for_unverified: 'readAndWrite' }, true);

describe('findGuestFoodFeedbackViolation', () => {
  it('allows everything the settings allow', () => {
    expect(findGuestFoodFeedbackViolation({ rating: 5, comment: 'Lecker' }, [], everythingAllowed)).toBeNull();
  });

  it('blocks a new rating when unverified profiles may not rate', () => {
    expect(findGuestFoodFeedbackViolation({ rating: 5 }, [], nothingAllowed)).toBe(BackendTranslationKeys.food_feedback_guest_rating_forbidden);
  });

  it('blocks a new comment when unverified profiles may not write comments', () => {
    expect(findGuestFoodFeedbackViolation({ comment: 'Lecker' }, [], nothingAllowed)).toBe(BackendTranslationKeys.food_feedback_guest_comment_forbidden);
  });

  it('allows removing a rating or comment', () => {
    expect(findGuestFoodFeedbackViolation({ rating: null, comment: null }, [{ rating: 5, comment: 'Lecker' }], nothingAllowed)).toBeNull();
    expect(findGuestFoodFeedbackViolation({ comment: '   ' }, [], nothingAllowed)).toBeNull();
  });

  it('allows saving values the feedback already had', () => {
    expect(findGuestFoodFeedbackViolation({ rating: 5, comment: 'Lecker' }, [{ rating: 5, comment: 'Lecker' }], nothingAllowed)).toBeNull();
  });

  it('blocks changing an existing rating', () => {
    expect(findGuestFoodFeedbackViolation({ rating: 4 }, [{ rating: 5 }], nothingAllowed)).toBe(BackendTranslationKeys.food_feedback_guest_rating_forbidden);
  });

  it('ignores feedbacks that neither rate nor comment', () => {
    expect(findGuestFoodFeedbackViolation({}, [], nothingAllowed)).toBeNull();
  });
});
