import { FOOD_FEEDBACK_SETTING_INHERIT, FoodFeedbackPermissionHelper, FoodsFeedbacksCommentsTypes } from '../FoodFeedbackPermissionHelper';

describe('FoodFeedbackPermissionHelper', () => {
  it('lets verified profiles rate unless foods_ratings_type is disabled', () => {
    expect(FoodFeedbackPermissionHelper.canRate(null, false)).toBe(true);
    expect(FoodFeedbackPermissionHelper.canRate({ foods_ratings_type: 'stars' }, false)).toBe(true);
    expect(FoodFeedbackPermissionHelper.canRate({ foods_ratings_type: 'stars', foods_ratings_type_for_unverified: 'disabled' }, false)).toBe(true);
    expect(FoodFeedbackPermissionHelper.canRate({ foods_ratings_type: 'disabled' }, false)).toBe(false);
  });

  it('lets unverified profiles follow verified profiles when inherit or empty', () => {
    expect(FoodFeedbackPermissionHelper.canRate(null, true)).toBe(true);
    expect(FoodFeedbackPermissionHelper.canRate({ foods_ratings_type: 'stars', foods_ratings_type_for_unverified: FOOD_FEEDBACK_SETTING_INHERIT }, true)).toBe(true);
    expect(FoodFeedbackPermissionHelper.canRate({ foods_ratings_type: 'stars', foods_ratings_type_for_unverified: null }, true)).toBe(true);
    expect(FoodFeedbackPermissionHelper.canRate({ foods_ratings_type: 'disabled', foods_ratings_type_for_unverified: FOOD_FEEDBACK_SETTING_INHERIT }, true)).toBe(false);
  });

  it('keeps unverified profiles from rating when their type is disabled', () => {
    expect(FoodFeedbackPermissionHelper.canRate({ foods_ratings_type: 'stars', foods_ratings_type_for_unverified: 'disabled' }, true)).toBe(false);
  });

  it('uses the regular comments type for verified profiles', () => {
    const appSettings = { foods_feedbacks_comments_type: 'readAndWrite', foods_feedbacks_comments_type_for_unverified: 'disabled' };
    expect(FoodFeedbackPermissionHelper.getCommentsType(appSettings, false)).toBe(FoodsFeedbacksCommentsTypes.readAndWrite);
  });

  it('uses the unverified comments type for unverified profiles', () => {
    const appSettings = { foods_feedbacks_comments_type: 'readAndWrite', foods_feedbacks_comments_type_for_unverified: 'read' };
    expect(FoodFeedbackPermissionHelper.getCommentsType(appSettings, true)).toBe(FoodsFeedbacksCommentsTypes.read);
  });

  it('falls back to the regular comments type when no unverified type is set', () => {
    const appSettings = { foods_feedbacks_comments_type: 'write', foods_feedbacks_comments_type_for_unverified: null };
    expect(FoodFeedbackPermissionHelper.getCommentsType(appSettings, true)).toBe(FoodsFeedbacksCommentsTypes.write);
  });

  it('follows the regular comments type when the unverified type is inherit', () => {
    const appSettings = { foods_feedbacks_comments_type: 'readAndWrite', foods_feedbacks_comments_type_for_unverified: FOOD_FEEDBACK_SETTING_INHERIT };
    expect(FoodFeedbackPermissionHelper.getCommentsType(appSettings, true)).toBe(FoodsFeedbacksCommentsTypes.readAndWrite);
    expect(FoodFeedbackPermissionHelper.getCommentsType({ ...appSettings, foods_feedbacks_comments_type: 'disabled' }, true)).toBe(FoodsFeedbacksCommentsTypes.disabled);
  });

  it('treats a missing or unknown comments type as disabled', () => {
    expect(FoodFeedbackPermissionHelper.getCommentsType(null, false)).toBe(FoodsFeedbacksCommentsTypes.disabled);
    expect(FoodFeedbackPermissionHelper.getCommentsType({ foods_feedbacks_comments_type: 'foo' }, true)).toBe(FoodsFeedbacksCommentsTypes.disabled);
  });

  it('derives read and write rights from the comments type', () => {
    expect(FoodFeedbackPermissionHelper.getPermissions({ foods_feedbacks_comments_type_for_unverified: 'write' }, true)).toMatchObject({
      canRate: true,
      commentsType: 'write',
      canWriteComments: true,
      canReadComments: false,
    });
    expect(FoodFeedbackPermissionHelper.getPermissions({ foods_feedbacks_comments_type_for_unverified: 'read', foods_ratings_type_for_unverified: 'disabled' }, true)).toMatchObject({
      canRate: false,
      commentsType: 'read',
      canWriteComments: false,
      canReadComments: true,
    });
  });

  it('shows rating locked for unverified profiles when only their setting disables it', () => {
    const appSettings = { foods_ratings_type: 'stars', foods_ratings_type_for_unverified: 'disabled' };
    expect(FoodFeedbackPermissionHelper.getPermissions(appSettings, true)).toMatchObject({ canRate: false, showRating: true, ratingRequiresVerifiedAccount: true });
    expect(FoodFeedbackPermissionHelper.getPermissions(appSettings, false)).toMatchObject({ canRate: true, showRating: true, ratingRequiresVerifiedAccount: true });
  });

  it('hides rating for everybody when foods_ratings_type is disabled', () => {
    const appSettings = { foods_ratings_type: 'disabled', foods_ratings_type_for_unverified: 'disabled' };
    expect(FoodFeedbackPermissionHelper.getPermissions(appSettings, true)).toMatchObject({ canRate: false, showRating: false, ratingRequiresVerifiedAccount: false });
    expect(FoodFeedbackPermissionHelper.getPermissions(appSettings, false)).toMatchObject({ canRate: false, showRating: false, ratingRequiresVerifiedAccount: false });
  });

  it('does not require a verified account when unverified profiles inherit', () => {
    const appSettings = { foods_ratings_type: 'stars', foods_ratings_type_for_unverified: FOOD_FEEDBACK_SETTING_INHERIT, foods_feedbacks_comments_type: 'readAndWrite' };
    expect(FoodFeedbackPermissionHelper.getPermissions(appSettings, true)).toMatchObject({ ratingRequiresVerifiedAccount: false, writingCommentsRequiresVerifiedAccount: false });
  });

  it('shows the comment input locked for unverified profiles that may not write', () => {
    const appSettings = { foods_feedbacks_comments_type: 'readAndWrite', foods_feedbacks_comments_type_for_unverified: 'read' };
    expect(FoodFeedbackPermissionHelper.getPermissions(appSettings, true)).toMatchObject({ canWriteComments: false, showCommentInput: true, writingCommentsRequiresVerifiedAccount: true });
    expect(FoodFeedbackPermissionHelper.getPermissions({ foods_feedbacks_comments_type: 'read' }, true)).toMatchObject({ showCommentInput: false, writingCommentsRequiresVerifiedAccount: false });
  });
});
