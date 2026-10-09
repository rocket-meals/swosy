import { describe, expect, it } from '@jest/globals';
import { FeatureWishStatus } from 'repo-depkit-common';
import { FeatureWishModeration } from '../FeatureWishModeration';
import { FeatureWishDailyReport } from '../FeatureWishDailyReport';
import { DirectusOpenAiCompatibleClient } from '../../helpers/ai/DirectusOpenAiCompatibleClient';

const candidateIds = new Set(['new-1', 'new-2', 'new-3']);
const publishedIds = new Set(['original']);

describe('FeatureWishModeration.parseDecisions', () => {
  it('turns valid decisions into suggestions only', () => {
    const result = FeatureWishModeration.parseDecisions(
      {
        decisions: [
          { id: 'new-1', suggestion: 'publish', reasons: [], note: 'passt' },
          { id: 'new-2', suggestion: 'decline', reasons: ['personal_data'], note: 'enthält einen Namen' },
          { id: 'new-3', suggestion: 'merge', related_to: 'original', reasons: [], note: 'gleicher Wunsch' },
        ],
      },
      candidateIds,
      publishedIds
    );
    expect(result.ignored).toEqual([]);
    expect(result.updates).toEqual([
      { id: 'new-1', status: FeatureWishStatus.AI_SUGGESTS_PUBLISH, related_to: null, moderation_note_intern: 'KI: passt' },
      { id: 'new-2', status: FeatureWishStatus.AI_SUGGESTS_DECLINE, related_to: null, moderation_note_intern: 'KI (personal_data): enthält einen Namen' },
      { id: 'new-3', status: FeatureWishStatus.AI_SUGGESTS_MERGE, related_to: 'original', moderation_note_intern: 'KI: gleicher Wunsch' },
    ]);
  });

  it('never publishes directly and ignores unknown ids, suggestions and merge targets', () => {
    const result = FeatureWishModeration.parseDecisions(
      {
        decisions: [
          { id: 'new-1', suggestion: 'published' },
          { id: 'someone-else', suggestion: 'publish' },
          { id: 'new-2', suggestion: 'merge', related_to: 'not-published' },
          { id: 'new-3', suggestion: 'merge', related_to: 'new-3' },
          { id: 'new-3', suggestion: 'publish' },
          { id: 'new-3', suggestion: 'decline' },
        ],
      },
      candidateIds,
      publishedIds
    );
    expect(result.updates).toEqual([{ id: 'new-3', status: FeatureWishStatus.AI_SUGGESTS_PUBLISH, related_to: null, moderation_note_intern: 'KI' }]);
    expect(result.ignored).toHaveLength(5);
  });

  it('ignores an answer without decisions', () => {
    expect(FeatureWishModeration.parseDecisions({ foo: 1 }, candidateIds, publishedIds).updates).toEqual([]);
    expect(FeatureWishModeration.parseDecisions(null, candidateIds, publishedIds).updates).toEqual([]);
  });

  it('sends only ids and texts of the wishes, no user data', () => {
    const prompt = FeatureWishModeration.buildPrompt([{ id: 'new-1', title: 'Widget', description: null }], [{ id: 'original', title: 'Dark Mode' }]);
    expect(JSON.parse(prompt.user)).toEqual({
      wishes_to_review: [{ id: 'new-1', title: 'Widget', description: '' }],
      published_wishes: [{ id: 'original', title: 'Dark Mode' }],
    });
    expect(prompt.system).toContain('"decisions"');
  });
});

describe('FeatureWishDailyReport', () => {
  const base = { projectName: 'Studi Futter', itemBaseUrl: 'https://example.com/admin/content/feature_whishes/', runNotes: [], reviewChanged: true };
  const waiting = { id: 'a', status: FeatureWishStatus.AI_SUGGESTS_PUBLISH, title: 'Widget', moderation_note_intern: 'KI: passt' };
  const liked = { id: 'b', status: FeatureWishStatus.PUBLISHED, title: 'Dark Mode', likes_amount: 3, likes_amount_last_checked: 1 };

  it('sends no mail when nothing waits and no like changed', () => {
    expect(FeatureWishDailyReport.build({ ...base, inReview: [], likeChanges: [] })).toBeNull();
  });

  it('sends no mail when the wishes in review are the same as in the last mail and no like changed', () => {
    expect(FeatureWishDailyReport.build({ ...base, reviewChanged: false, inReview: [waiting], likeChanges: [] })).toBeNull();
    expect(FeatureWishDailyReport.build({ ...base, reviewChanged: true, inReview: [waiting], likeChanges: [] })).not.toBeNull();
    expect(FeatureWishDailyReport.build({ ...base, reviewChanged: false, inReview: [waiting], likeChanges: [liked] })).not.toBeNull();
  });

  it('changes the review hash only when a wish, its status or the note of the AI changes', () => {
    const hash = FeatureWishDailyReport.getReviewHash([waiting, { ...waiting, id: 'c', status: FeatureWishStatus.DRAFT }]);
    expect(FeatureWishDailyReport.getReviewHash([{ ...waiting, id: 'c', status: FeatureWishStatus.DRAFT }, waiting])).toBe(hash);
    expect(FeatureWishDailyReport.getReviewHash([waiting, { ...waiting, id: 'c', status: FeatureWishStatus.AI_SUGGESTS_DECLINE }])).not.toBe(hash);
    expect(FeatureWishDailyReport.getReviewHash([waiting, { ...waiting, id: 'c', status: FeatureWishStatus.DRAFT, moderation_note_intern: 'neu' }])).not.toBe(hash);
    expect(FeatureWishDailyReport.getReviewHash([waiting])).not.toBe(hash);
  });

  it('lists wishes in review with the suggestion and likes sorted by change', () => {
    const report = FeatureWishDailyReport.build({
      ...base,
      runNotes: ['KI-Prüfung: 1 Vorschläge gespeichert.'],
      inReview: [{ id: 'a', status: FeatureWishStatus.AI_SUGGESTS_DECLINE, title: 'Max  Muster\nbitte', moderation_note_intern: 'KI (personal_data): Name' }],
      likeChanges: [
        { id: 'b', status: FeatureWishStatus.PUBLISHED, title: 'Widget', likes_amount: 12, likes_amount_last_checked: 10 },
        { id: 'c', status: FeatureWishStatus.PUBLISHED, title: 'Dark Mode', likes_amount: 9, likes_amount_last_checked: 4 },
        { id: 'd', status: FeatureWishStatus.PUBLISHED, title: 'Karte', likes_amount: 1, likes_amount_last_checked: 2 },
      ],
    });
    expect(report?.subject).toBe('Studi Futter - Feature-Wünsche: 1 offen, 3 mit neuen Likes');
    expect(report?.markdown).toContain('- **Max Muster bitte** (KI empfiehlt Ablehnung), [öffnen](https://example.com/admin/content/feature_whishes/a)');
    expect(report?.markdown).toContain('_KI (personal_data): Name_');
    const order = ['Dark Mode', 'Widget', 'Karte'].map(title => report?.markdown.indexOf(`**${title}**`) ?? -1);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(report?.markdown).toContain('**Karte**: 1 (-1)');
    expect(report?.markdown).toContain('- KI-Prüfung: 1 Vorschläge gespeichert.');
  });
});

describe('DirectusOpenAiCompatibleClient', () => {
  it('reads the provider from the Directus settings row', () => {
    const settings = DirectusOpenAiCompatibleClient.parseSettings({
      ai_openai_compatible_name: 'Agent Board',
      ai_openai_compatible_base_url: ' https://board.example.com/v1 ',
      ai_openai_compatible_api_key: 'key',
      ai_openai_compatible_headers: JSON.stringify([
        { header: 'X-Team', value: 'rocket' },
        { header: '', value: 'x' },
      ]),
      ai_openai_compatible_models: [{ id: 'claude' }, 'second', { name: 'no id' }],
    });
    expect(settings).toEqual({ name: 'Agent Board', baseUrl: 'https://board.example.com/v1', apiKey: 'key', headers: { 'X-Team': 'rocket' }, models: ['claude', 'second'] });
  });

  it('is not configured without base url or key', () => {
    expect(DirectusOpenAiCompatibleClient.parseSettings({ ai_openai_compatible_base_url: 'https://x', ai_openai_compatible_api_key: null })).toBeNull();
    expect(DirectusOpenAiCompatibleClient.parseSettings(undefined)).toBeNull();
  });

  it('finds the JSON in a fenced or chatty answer', () => {
    expect(DirectusOpenAiCompatibleClient.extractJson('```json\n{"decisions":[]}\n```')).toEqual({ decisions: [] });
    expect(DirectusOpenAiCompatibleClient.extractJson('Hier ist das Ergebnis: {"decisions":[1]} Viele Grüße')).toEqual({ decisions: [1] });
    expect(() => DirectusOpenAiCompatibleClient.extractJson('keine Ahnung')).toThrow();
  });

  it('asks the first configured model and returns the parsed answer', async () => {
    const calls: any[] = [];
    const fakeOpenAi = {
      chat: { completions: { create: async (body: any) => (calls.push(body), { choices: [{ message: { content: '{"ok":true}' } }] }) } },
    } as any;
    const client = new DirectusOpenAiCompatibleClient({ name: null, baseUrl: 'https://x', apiKey: 'k', headers: {}, models: ['model-a'] }, fakeOpenAi);
    await expect(client.chatJson({ system: 's', user: 'u' })).resolves.toEqual({ ok: true });
    expect(calls[0]).toMatchObject({
      model: 'model-a',
      messages: [
        { role: 'system', content: 's' },
        { role: 'user', content: 'u' },
      ],
    });
  });

  // Runs only against a real provider: FEATURE_WISHES_AI_BASE_URL, FEATURE_WISHES_AI_API_KEY, FEATURE_WISHES_AI_MODEL.
  const liveBaseUrl = process.env.FEATURE_WISHES_AI_BASE_URL;
  (liveBaseUrl ? it : it.skip)(
    'gets usable decisions from a real OpenAI-compatible provider',
    async () => {
      const client = new DirectusOpenAiCompatibleClient({
        name: null,
        baseUrl: liveBaseUrl as string,
        apiKey: process.env.FEATURE_WISHES_AI_API_KEY ?? '',
        headers: {},
        models: [process.env.FEATURE_WISHES_AI_MODEL ?? ''],
      });
      const candidates = [
        { id: 'w1', title: 'Widget mit dem Speiseplan', description: 'Auf dem Homescreen sehen, was es heute gibt.' },
        { id: 'w2', title: 'Max Mustermann ist doof', description: 'Ruft ihn an: 0151 1234567' },
      ];
      const prompt = FeatureWishModeration.buildPrompt(candidates, [{ id: 'p1', title: 'Homescreen-Widget für den Speiseplan' }]);
      const answer = await client.chatJson(prompt);
      const result = FeatureWishModeration.parseDecisions(answer, new Set(['w1', 'w2']), new Set(['p1']));
      expect(result.updates.find(update => update.id === 'w2')?.status).toBe(FeatureWishStatus.AI_SUGGESTS_DECLINE);
    },
    10 * 60 * 1000
  );
});
