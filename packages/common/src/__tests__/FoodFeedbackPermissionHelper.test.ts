import { FOODS_FEEDBACKS_COMMENTS_TYPE_INHERIT, FoodFeedbackPermissionHelper, FoodsFeedbacksCommentsTypes } from '../FoodFeedbackPermissionHelper';

describe('FoodFeedbackPermissionHelper', () => {
  it('always lets verified profiles rate', () => {
    expect(FoodFeedbackPermissionHelper.canRate({ foods_ratings_enabled_for_unverified: false }, false)).toBe(true);
  });

  it('lets unverified profiles rate unless it is switched off explicitly', () => {
    expect(FoodFeedbackPermissionHelper.canRate(null, true)).toBe(true);
    expect(FoodFeedbackPermissionHelper.canRate({ foods_ratings_enabled_for_unverified: null }, true)).toBe(true);
    expect(FoodFeedbackPermissionHelper.canRate({ foods_ratings_enabled_for_unverified: true }, true)).toBe(true);
    expect(FoodFeedbackPermissionHelper.canRate({ foods_ratings_enabled_for_unverified: false }, true)).toBe(false);
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
    const appSettings = { foods_feedbacks_comments_type: 'readAndWrite', foods_feedbacks_comments_type_for_unverified: FOODS_FEEDBACKS_COMMENTS_TYPE_INHERIT };
    expect(FoodFeedbackPermissionHelper.getCommentsType(appSettings, true)).toBe(FoodsFeedbacksCommentsTypes.readAndWrite);
    expect(FoodFeedbackPermissionHelper.getCommentsType({ ...appSettings, foods_feedbacks_comments_type: 'disabled' }, true)).toBe(FoodsFeedbacksCommentsTypes.disabled);
  });

  it('treats a missing or unknown comments type as disabled', () => {
    expect(FoodFeedbackPermissionHelper.getCommentsType(null, false)).toBe(FoodsFeedbacksCommentsTypes.disabled);
    expect(FoodFeedbackPermissionHelper.getCommentsType({ foods_feedbacks_comments_type: 'foo' }, true)).toBe(FoodsFeedbacksCommentsTypes.disabled);
  });

  it('derives read and write rights from the comments type', () => {
    expect(FoodFeedbackPermissionHelper.getPermissions({ foods_feedbacks_comments_type_for_unverified: 'write' }, true)).toEqual({
      canRate: true,
      commentsType: 'write',
      canWriteComments: true,
      canReadComments: false,
    });
    expect(FoodFeedbackPermissionHelper.getPermissions({ foods_feedbacks_comments_type_for_unverified: 'read', foods_ratings_enabled_for_unverified: false }, true)).toEqual({
      canRate: false,
      commentsType: 'read',
      canWriteComments: false,
      canReadComments: true,
    });
  });
});
