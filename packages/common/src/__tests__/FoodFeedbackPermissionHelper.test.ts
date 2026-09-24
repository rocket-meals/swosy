import { FoodFeedbackPermissionHelper, FoodsFeedbacksCommentsTypes } from '../FoodFeedbackPermissionHelper';

describe('FoodFeedbackPermissionHelper', () => {
  it('always lets registered users rate', () => {
    expect(FoodFeedbackPermissionHelper.canRate({ foods_ratings_guests_enabled: false }, false)).toBe(true);
  });

  it('lets guests rate unless it is switched off explicitly', () => {
    expect(FoodFeedbackPermissionHelper.canRate(null, true)).toBe(true);
    expect(FoodFeedbackPermissionHelper.canRate({ foods_ratings_guests_enabled: null }, true)).toBe(true);
    expect(FoodFeedbackPermissionHelper.canRate({ foods_ratings_guests_enabled: true }, true)).toBe(true);
    expect(FoodFeedbackPermissionHelper.canRate({ foods_ratings_guests_enabled: false }, true)).toBe(false);
  });

  it('uses the regular comments type for registered users', () => {
    const appSettings = { foods_feedbacks_comments_type: 'readAndWrite', foods_feedbacks_comments_type_guests: 'disabled' };
    expect(FoodFeedbackPermissionHelper.getCommentsType(appSettings, false)).toBe(FoodsFeedbacksCommentsTypes.readAndWrite);
  });

  it('uses the guest comments type for guests', () => {
    const appSettings = { foods_feedbacks_comments_type: 'readAndWrite', foods_feedbacks_comments_type_guests: 'read' };
    expect(FoodFeedbackPermissionHelper.getCommentsType(appSettings, true)).toBe(FoodsFeedbacksCommentsTypes.read);
  });

  it('falls back to the regular comments type when no guest type is set', () => {
    const appSettings = { foods_feedbacks_comments_type: 'write', foods_feedbacks_comments_type_guests: null };
    expect(FoodFeedbackPermissionHelper.getCommentsType(appSettings, true)).toBe(FoodsFeedbacksCommentsTypes.write);
  });

  it('treats a missing or unknown comments type as disabled', () => {
    expect(FoodFeedbackPermissionHelper.getCommentsType(null, false)).toBe(FoodsFeedbacksCommentsTypes.disabled);
    expect(FoodFeedbackPermissionHelper.getCommentsType({ foods_feedbacks_comments_type: 'foo' }, true)).toBe(FoodsFeedbacksCommentsTypes.disabled);
  });

  it('derives read and write rights from the comments type', () => {
    expect(FoodFeedbackPermissionHelper.getPermissions({ foods_feedbacks_comments_type_guests: 'write' }, true)).toEqual({
      canRate: true,
      commentsType: 'write',
      canWriteComments: true,
      canReadComments: false,
    });
    expect(FoodFeedbackPermissionHelper.getPermissions({ foods_feedbacks_comments_type_guests: 'read', foods_ratings_guests_enabled: false }, true)).toEqual({
      canRate: false,
      commentsType: 'read',
      canWriteComments: false,
      canReadComments: true,
    });
  });
});
