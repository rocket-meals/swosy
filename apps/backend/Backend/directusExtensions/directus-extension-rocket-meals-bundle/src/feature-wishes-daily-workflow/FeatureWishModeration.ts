import { FeatureWishStatus } from 'repo-depkit-common';

export type ModerationCandidate = { id: string; title: string; description: string | null };
export type PublishedWish = { id: string; title: string };

export enum ModerationSuggestion {
  PUBLISH = 'publish',
  DECLINE = 'decline',
  MERGE = 'merge',
}

/** What the backend writes for one wish after the AI answered. Never more than a suggestion. */
export type ModerationUpdate = {
  id: string;
  status: FeatureWishStatus.AI_SUGGESTS_PUBLISH | FeatureWishStatus.AI_SUGGESTS_DECLINE | FeatureWishStatus.AI_SUGGESTS_MERGE;
  related_to: string | null;
  moderation_note_intern: string;
};

export type ModerationParseResult = { updates: ModerationUpdate[]; ignored: string[] };

const STATUS_BY_SUGGESTION: Record<ModerationSuggestion, ModerationUpdate['status']> = {
  [ModerationSuggestion.PUBLISH]: FeatureWishStatus.AI_SUGGESTS_PUBLISH,
  [ModerationSuggestion.DECLINE]: FeatureWishStatus.AI_SUGGESTS_DECLINE,
  [ModerationSuggestion.MERGE]: FeatureWishStatus.AI_SUGGESTS_MERGE,
};

const NOTE_MAX_LENGTH = 1000;

const SYSTEM_PROMPT = `Du prüfst Feature-Wünsche, die Nutzer in einer Mensa- und Campus-App eingereicht haben, bevor ein Mensch sie freigibt.
Für jeden Wunsch schlägst du genau eine Entscheidung vor:
- "publish": der Wunsch darf öffentlich sichtbar werden.
- "decline": der Wunsch verstößt gegen eine Regel.
- "merge": der Wunsch beschreibt dasselbe wie ein bereits veröffentlichter Wunsch. Gib dann dessen id als "related_to" an.

Regeln, gegen die ein Wunsch verstößt:
- personal_data: Namen, E-Mail-Adressen, Telefonnummern oder andere Angaben zu Personen.
- insult: Beleidigungen, Hass, Belästigung, sexuelle oder gewalttätige Inhalte.
- spam: Werbung, Links, sinnlose Zeichenfolgen.
- off_topic: hat nichts mit der App zu tun.
Kritik an Speisen oder an der App ist erlaubt, solange sie sachlich ist.

Antworte ausschließlich mit einem JSON-Objekt in genau dieser Form, ohne weiteren Text:
{"decisions":[{"id":"<id>","suggestion":"publish|decline|merge","related_to":"<id oder null>","reasons":["<regel>"],"note":"<kurze Begründung auf Deutsch>"}]}`;

export class FeatureWishModeration {
  static readonly MAX_CANDIDATES_PER_RUN = 50;
  static readonly MAX_PUBLISHED_FOR_DUPLICATES = 300;

  static buildPrompt(candidates: ModerationCandidate[], published: PublishedWish[]): { system: string; user: string } {
    const user = JSON.stringify(
      {
        wishes_to_review: candidates.map(candidate => ({ id: candidate.id, title: candidate.title, description: candidate.description ?? '' })),
        published_wishes: published.map(wish => ({ id: wish.id, title: wish.title })),
      },
      null,
      2
    );
    return { system: SYSTEM_PROMPT, user };
  }

  /**
   * Checks the answer of the AI strictly. Only decisions for wishes that were sent, with a known
   * suggestion and, for a merge, a published original, become updates. Everything else is ignored
   * and the wish stays in `draft` for the next run.
   */
  static parseDecisions(answer: unknown, candidateIds: Set<string>, publishedIds: Set<string>): ModerationParseResult {
    const updates: ModerationUpdate[] = [];
    const ignored: string[] = [];
    const decisions = (answer as { decisions?: unknown })?.decisions;
    if (!Array.isArray(decisions)) {
      return { updates, ignored: ['the answer has no "decisions" list'] };
    }
    const handled = new Set<string>();
    for (const decision of decisions) {
      const id = typeof decision?.id === 'string' ? decision.id : null;
      if (!id || !candidateIds.has(id) || handled.has(id)) {
        ignored.push(`unknown or repeated id: ${String(decision?.id)}`);
        continue;
      }
      const suggestion = decision.suggestion as ModerationSuggestion;
      const status = STATUS_BY_SUGGESTION[suggestion];
      if (!status) {
        ignored.push(`${id}: unknown suggestion ${String(decision.suggestion)}`);
        continue;
      }
      let relatedTo: string | null = null;
      if (suggestion === ModerationSuggestion.MERGE) {
        relatedTo = typeof decision.related_to === 'string' ? decision.related_to : null;
        if (!relatedTo || !publishedIds.has(relatedTo) || relatedTo === id) {
          ignored.push(`${id}: merge without a published original`);
          continue;
        }
      }
      handled.add(id);
      updates.push({ id, status, related_to: relatedTo, moderation_note_intern: FeatureWishModeration.buildNote(decision) });
    }
    return { updates, ignored };
  }

  private static buildNote(decision: { reasons?: unknown; note?: unknown }): string {
    const reasons = Array.isArray(decision.reasons) ? decision.reasons.filter((reason): reason is string => typeof reason === 'string') : [];
    const note = typeof decision.note === 'string' ? decision.note.trim() : '';
    let text = 'KI';
    if (reasons.length > 0) {
      text += ` (${reasons.join(', ')})`;
    }
    if (note) {
      text += `: ${note}`;
    }
    return text.slice(0, NOTE_MAX_LENGTH);
  }
}
