import { describe, expect, it } from '@jest/globals';
import { DatabaseTypes, FeatureWishStatus } from 'repo-depkit-common';
import { FeatureWishService } from '../FeatureWishService';
import { MyDatabaseHelper } from '../../helpers/MyDatabaseHelper';

type Row = Partial<DatabaseTypes.FeatureWhishes> & { id: string };
type Condition = Record<string, Record<string, unknown>>;

/** Evaluates the small subset of Directus filters the service uses. */
function matches(row: Row, filter: any): boolean {
  if (!filter) {
    return true;
  }
  if (filter._and) {
    return filter._and.every((part: any) => matches(row, part));
  }
  if (filter._or) {
    return filter._or.some((part: any) => matches(row, part));
  }
  return Object.entries(filter as Condition).every(([field, condition]) => {
    const value = (row as Record<string, unknown>)[field] ?? null;
    return Object.entries(condition).every(([operator, expected]) => {
      switch (operator) {
        case '_eq':
          return value === expected;
        case '_neq':
          return value !== expected;
        case '_in':
          return (expected as unknown[]).includes(value);
        case '_nin':
          return !(expected as unknown[]).includes(value);
        case '_null':
          return expected ? value === null : value !== null;
        case '_nnull':
          return expected ? value !== null : value === null;
        default:
          throw new Error('unsupported operator ' + operator);
      }
    });
  });
}

function createService(initialRows: Row[]) {
  const rows = new Map(initialRows.map(row => [row.id, { ...row }]));
  const helper = {
    readByQuery: async (query: any) => [...rows.values()].filter(row => matches(row, query.filter)).map(row => ({ ...row })),
    deleteByQuery: async (query: any) => {
      const ids = [...rows.values()].filter(row => matches(row, query.filter)).map(row => row.id);
      ids.forEach(id => rows.delete(id));
      return ids;
    },
    deleteMany: async (ids: string[]) => {
      for (const id of ids) {
        if ([...rows.values()].some(row => row.related_to === id && !ids.includes(row.id))) {
          throw new Error('foreign key violation: ' + id + ' is still referenced');
        }
      }
      ids.forEach(id => rows.delete(id));
      return ids;
    },
    updateOneWithoutHookTrigger: async ({ primary_key, update }: { primary_key: string; update: Partial<Row> }) => {
      const row = rows.get(primary_key);
      if (row) {
        Object.assign(row, update);
      }
    },
  };
  const myDatabaseHelper = { getItemsServiceHelper: () => helper } as unknown as MyDatabaseHelper;
  return { service: new FeatureWishService(myDatabaseHelper), rows };
}

describe('FeatureWishService', () => {
  it('recounts likes from the author, like and merged rows and writes only changed values', async () => {
    const { service, rows } = createService([
      { id: 'original', status: FeatureWishStatus.PUBLISHED, likes_amount: 7 },
      { id: 'other', status: FeatureWishStatus.PUBLISHED, likes_amount: 0 },
      { id: 'like-1', status: FeatureWishStatus.LIKE, related_to: 'original' },
      { id: 'like-2', status: FeatureWishStatus.LIKE, related_to: 'original' },
      { id: 'duplicate', status: FeatureWishStatus.MERGED, related_to: 'original', likes_amount: null },
      { id: 'suggestion', status: FeatureWishStatus.AI_SUGGESTS_MERGE, related_to: 'other', likes_amount: null },
    ]);

    const changed = await service.recountAllLikes();

    // the author counts as the first like
    expect(rows.get('original')?.likes_amount).toBe(4);
    expect(rows.get('other')?.likes_amount).toBe(1);
    expect(rows.get('suggestion')?.likes_amount).toBe(1);
    expect(changed).toBe(3);
  });

  it('deletes a wish together with its duplicates, their likes and its likes', async () => {
    const { service, rows } = createService([
      { id: 'original', status: FeatureWishStatus.PUBLISHED },
      { id: 'duplicate', status: FeatureWishStatus.MERGED, related_to: 'original' },
      { id: 'like-of-duplicate', status: FeatureWishStatus.LIKE, related_to: 'duplicate' },
      { id: 'like', status: FeatureWishStatus.LIKE, related_to: 'original' },
      { id: 'unrelated', status: FeatureWishStatus.PUBLISHED },
    ]);

    const deleted = await service.deleteWithDependents(['original']);

    expect(deleted).toBe(4);
    expect([...rows.keys()]).toEqual(['unrelated']);
  });

  it('points a merged wish and everything pointing to it to the final original', async () => {
    const { service, rows } = createService([
      { id: 'final', status: FeatureWishStatus.PUBLISHED },
      { id: 'middle', status: FeatureWishStatus.MERGED, related_to: 'final' },
      { id: 'new-duplicate', status: FeatureWishStatus.MERGED, related_to: 'middle' },
      { id: 'like-of-new-duplicate', status: FeatureWishStatus.LIKE, related_to: 'new-duplicate' },
    ]);

    await service.flattenMerges(['new-duplicate']);

    expect(rows.get('new-duplicate')?.related_to).toBe('final');
    expect(rows.get('like-of-new-duplicate')?.related_to).toBe('final');
  });

  it('clears suggestions and notes after the author edited a wish', async () => {
    const { service, rows } = createService([
      { id: 'wish', status: FeatureWishStatus.DRAFT, related_to: 'other', moderation_note_intern: 'dup', moderation_note_public: 'note' },
    ]);

    await service.resetAfterAuthorEdit(['wish']);

    expect(rows.get('wish')).toMatchObject({ related_to: null, moderation_note_intern: null, moderation_note_public: null });
  });
});
