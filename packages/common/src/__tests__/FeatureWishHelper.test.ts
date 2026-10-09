import { FeatureWishCreateError, FeatureWishHelper, FeatureWishStatus } from '../FeatureWishHelper';

describe('FeatureWishHelper.buildCreatePayload', () => {
  it('turns a request with related_to into a like without text', () => {
    const result = FeatureWishHelper.buildCreatePayload({ related_to: 'wish-1', title: 'sneaky text', description: 'more' }, 'profile-1');
    expect(result).toEqual({
      ok: true,
      isLike: true,
      payload: { profile: 'profile-1', status: FeatureWishStatus.LIKE, title: null, description: null, related_to: 'wish-1' },
    });
  });

  it('turns a request without related_to into a draft wish with trimmed text', () => {
    const result = FeatureWishHelper.buildCreatePayload({ id: 'abc', title: '  Widget  ', description: '  Bitte  ' }, null);
    expect(result).toEqual({
      ok: true,
      isLike: false,
      payload: { id: 'abc', status: FeatureWishStatus.DRAFT, title: 'Widget', description: 'Bitte', related_to: null },
    });
  });

  it('drops fields the app may not set', () => {
    const input = { title: 'Widget', status: 'published', likes_amount: 999, progress: 'released' } as Record<string, unknown>;
    const result = FeatureWishHelper.buildCreatePayload(input, null);
    expect(result.ok && result.payload).toEqual({ status: FeatureWishStatus.DRAFT, title: 'Widget', description: null, related_to: null });
  });

  it('rejects a wish without title or with too long texts', () => {
    expect(FeatureWishHelper.buildCreatePayload({ title: '   ' }, null)).toEqual({ ok: false, error: FeatureWishCreateError.TITLE_MISSING });
    expect(FeatureWishHelper.buildCreatePayload({ title: 'x'.repeat(81) }, null)).toEqual({ ok: false, error: FeatureWishCreateError.TITLE_TOO_LONG });
    expect(FeatureWishHelper.buildCreatePayload({ title: 'ok', description: 'x'.repeat(1001) }, null)).toEqual({
      ok: false,
      error: FeatureWishCreateError.DESCRIPTION_TOO_LONG,
    });
  });

  it('accepts texts at the maximum length', () => {
    expect(FeatureWishHelper.buildCreatePayload({ title: 'x'.repeat(80), description: 'y'.repeat(1000) }, null).ok).toBe(true);
  });
});

describe('FeatureWishHelper.countLikesByWishId', () => {
  it('counts merged and like rows per target and ignores the rest', () => {
    const counts = FeatureWishHelper.countLikesByWishId([
      { status: FeatureWishStatus.LIKE, related_to: 'a' },
      { status: FeatureWishStatus.MERGED, related_to: { id: 'a' } },
      { status: FeatureWishStatus.LIKE, related_to: 'b' },
      { status: FeatureWishStatus.AI_SUGGESTS_MERGE, related_to: 'b' },
      { status: FeatureWishStatus.LIKE, related_to: null },
      { status: FeatureWishStatus.PUBLISHED },
    ]);
    expect(counts).toEqual({ a: 2, b: 1 });
  });
});

describe('FeatureWishHelper status groups', () => {
  it('lets authors edit their wishes but not duplicates and likes', () => {
    expect(FeatureWishHelper.isEditable({ status: FeatureWishStatus.DRAFT })).toBe(true);
    expect(FeatureWishHelper.isEditable({ status: FeatureWishStatus.ARCHIVED })).toBe(true);
    expect(FeatureWishHelper.isEditable({ status: FeatureWishStatus.PUBLISHED })).toBe(true);
    expect(FeatureWishHelper.isEditable({ status: FeatureWishStatus.MERGED })).toBe(false);
    expect(FeatureWishHelper.isEditable({ status: FeatureWishStatus.LIKE })).toBe(false);
  });

  it('treats draft and ai suggestions as in review', () => {
    expect(FeatureWishHelper.isInReview({ status: FeatureWishStatus.AI_SUGGESTS_MERGE })).toBe(true);
    expect(FeatureWishHelper.isInReview({ status: FeatureWishStatus.ARCHIVED })).toBe(false);
  });
});

describe('FeatureWishHelper dates', () => {
  it('deletes archived wishes 30 days after their last change', () => {
    const date = FeatureWishHelper.getArchivedDeletionDate({ status: FeatureWishStatus.ARCHIVED, date_updated: '2026-10-01T10:00:00.000Z' });
    expect(date?.toISOString()).toBe('2026-10-31T10:00:00.000Z');
  });

  it('falls back to the creation date and ignores other statuses', () => {
    expect(FeatureWishHelper.getArchivedDeletionDate({ status: FeatureWishStatus.ARCHIVED, date_created: '2026-10-01T10:00:00.000Z' })).not.toBeNull();
    expect(FeatureWishHelper.getArchivedDeletionDate({ status: FeatureWishStatus.PUBLISHED, date_updated: '2026-10-01T10:00:00.000Z' })).toBeNull();
  });

  it('computes the cutoff for the cleanup', () => {
    expect(FeatureWishHelper.getArchivedDeletionCutoff(new Date('2026-10-31T10:00:00.000Z')).toISOString()).toBe('2026-10-01T10:00:00.000Z');
  });

  it('shows a hidden tile again after 30 days', () => {
    const now = new Date('2026-10-31T10:00:00.000Z');
    expect(FeatureWishHelper.isTileHidden('2026-10-02T10:00:00.000Z', now)).toBe(true);
    expect(FeatureWishHelper.isTileHidden('2026-10-01T09:00:00.000Z', now)).toBe(false);
    expect(FeatureWishHelper.isTileHidden(null, now)).toBe(false);
    expect(FeatureWishHelper.isTileHidden('not a date', now)).toBe(false);
  });

  it('allows three wishes per 24 hours', () => {
    const now = new Date('2026-10-09T12:00:00.000Z');
    const recent = ['2026-10-09T08:00:00.000Z', '2026-10-09T09:00:00.000Z'];
    expect(FeatureWishHelper.maySubmitAnotherWish(recent, now)).toBe(true);
    expect(FeatureWishHelper.maySubmitAnotherWish([...recent, '2026-10-09T10:00:00.000Z'], now)).toBe(false);
    expect(FeatureWishHelper.maySubmitAnotherWish([...recent, '2026-10-08T10:00:00.000Z'], now)).toBe(true);
  });
});

describe('FeatureWishHelper.resolveMergeTarget', () => {
  it('follows merged wishes to the final original', () => {
    const relatedTo: Record<string, string> = { a: 'b', b: 'c' };
    expect(FeatureWishHelper.resolveMergeTarget('a', id => relatedTo[id] ?? null)).toBe('c');
  });

  it('stops on a cycle', () => {
    const relatedTo: Record<string, string> = { a: 'b', b: 'a' };
    expect(FeatureWishHelper.resolveMergeTarget('a', id => relatedTo[id] ?? null)).toBe('b');
  });
});

describe('FeatureWishHelper.parseStatusIds', () => {
  const a = '11111111-1111-4111-8111-111111111111';
  const b = '22222222-2222-4222-8222-222222222222';

  it('accepts comma separated and repeated parameters and removes duplicates', () => {
    expect(FeatureWishHelper.parseStatusIds(`${a}, ${b.toUpperCase()}`)).toEqual([a, b]);
    expect(FeatureWishHelper.parseStatusIds([a, `${a},${b}`])).toEqual([a, b]);
  });

  it('ignores everything that is not a UUID', () => {
    expect(FeatureWishHelper.parseStatusIds(`${a},abc,' OR 1=1`)).toEqual([a]);
    expect(FeatureWishHelper.parseStatusIds(undefined)).toEqual([]);
    expect(FeatureWishHelper.parseStatusIds(42)).toEqual([]);
  });

  it('answers at most 50 ids', () => {
    const many = Array.from({ length: 60 }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`);
    expect(FeatureWishHelper.parseStatusIds(many.join(','))).toHaveLength(50);
  });
});

describe('FeatureWishHelper likes of the author', () => {
  it('counts the author as the first like', () => {
    expect(FeatureWishHelper.getExpectedLikesAmount('a', { a: 2 })).toBe(3);
    expect(FeatureWishHelper.getExpectedLikesAmount('b', { a: 2 })).toBe(1);
  });
});

describe('FeatureWishHelper.mayAppUserDelete', () => {
  it('lets a signed in user delete only rows of the own profile', () => {
    expect(FeatureWishHelper.mayAppUserDelete([{ status: 'published', profile: 'p1' }, { status: 'like', profile: { id: 'p1' } }], 'p1')).toBe(true);
    expect(FeatureWishHelper.mayAppUserDelete([{ status: 'draft', profile: 'p1' }, { status: 'draft', profile: 'p2' }], 'p1')).toBe(false);
  });

  it('lets anonymous users delete only rows without profile that are not public', () => {
    expect(FeatureWishHelper.mayAppUserDelete([{ status: 'draft', profile: null }, { status: 'like' }], null)).toBe(true);
    expect(FeatureWishHelper.mayAppUserDelete([{ status: 'published', profile: null }], null)).toBe(false);
    expect(FeatureWishHelper.mayAppUserDelete([{ status: 'draft', profile: 'p1' }], null)).toBe(false);
  });

  it('allows nothing for an empty selection', () => {
    expect(FeatureWishHelper.mayAppUserDelete([], 'p1')).toBe(false);
  });
});
