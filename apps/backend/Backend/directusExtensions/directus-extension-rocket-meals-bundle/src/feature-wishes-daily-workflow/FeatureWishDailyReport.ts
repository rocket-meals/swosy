import { DatabaseTypes, FeatureWishStatus } from 'repo-depkit-common';
import { HashHelper } from '../helpers/HashHelper';

type FeatureWish = DatabaseTypes.FeatureWhishes;

export type FeatureWishDailyReportInput = {
  projectName: string;
  /** e.g. `https://example.com/admin/content/feature_whishes/`, the id is appended. */
  itemBaseUrl: string;
  /** Wishes waiting for a human: draft or with a suggestion of the AI. */
  inReview: FeatureWish[];
  /** Published wishes whose likes changed since the last report. */
  likeChanges: FeatureWish[];
  /** What happened in this run, e.g. how many wishes the AI reviewed. */
  runNotes: string[];
  /** False when the wishes in review are the same as in the last mail (see `getReviewHash`). */
  reviewChanged: boolean;
};

const SUGGESTION_LABELS: Record<string, string> = {
  [FeatureWishStatus.DRAFT]: 'noch ungeprüft',
  [FeatureWishStatus.AI_SUGGESTS_PUBLISH]: 'KI empfiehlt Freigabe',
  [FeatureWishStatus.AI_SUGGESTS_DECLINE]: 'KI empfiehlt Ablehnung',
  [FeatureWishStatus.AI_SUGGESTS_MERGE]: 'KI hält es für eine Dublette',
};

/** Keeps user text from breaking the Markdown of the mail. */
function inline(text: string | null | undefined): string {
  return (text ?? '').split(/\s+/).join(' ').trim();
}

/**
 * The evening mail about feature wishes for support. Null when nothing changed since the last mail
 * (same wishes in review with the same suggestion, no like changed) or when there is nothing to
 * tell at all, so no repeated or empty mail is sent.
 */
export class FeatureWishDailyReport {
  static build(input: FeatureWishDailyReportInput): { subject: string; markdown: string } | null {
    if (input.likeChanges.length === 0 && (input.inReview.length === 0 || !input.reviewChanged)) {
      return null;
    }
    const lines: string[] = [`# Feature-Wünsche: ${input.projectName}`, ''];

    lines.push(`## Wartet auf deine Entscheidung (${input.inReview.length})`, '');
    if (input.inReview.length === 0) {
      lines.push('Nichts offen.', '');
    }
    for (const wish of input.inReview) {
      const label = SUGGESTION_LABELS[wish.status] ?? wish.status;
      lines.push(`- **${inline(wish.title)}** (${label}), [öffnen](${input.itemBaseUrl}${wish.id})`);
      if (wish.description) {
        lines.push(`  ${inline(wish.description)}`);
      }
      if (wish.moderation_note_intern) {
        lines.push(`  _${inline(wish.moderation_note_intern)}_`);
      }
    }
    lines.push('');

    if (input.likeChanges.length > 0) {
      lines.push(`## Likes seit dem letzten Bericht (${input.likeChanges.length})`, '');
      const sorted = [...input.likeChanges].sort((a, b) => FeatureWishDailyReport.getDelta(b) - FeatureWishDailyReport.getDelta(a));
      for (const wish of sorted) {
        const delta = FeatureWishDailyReport.getDelta(wish);
        const sign = delta > 0 ? '+' : '';
        lines.push(`- **${inline(wish.title)}**: ${wish.likes_amount ?? 0} (${sign}${delta}), [öffnen](${input.itemBaseUrl}${wish.id})`);
      }
      lines.push('');
    }

    if (input.runNotes.length > 0) {
      lines.push('## Lauf', '', ...input.runNotes.map(note => `- ${note}`), '');
    }

    return {
      subject: `${input.projectName} - Feature-Wünsche: ${input.inReview.length} offen, ${input.likeChanges.length} mit neuen Likes`,
      markdown: lines.join('\n'),
    };
  }

  /**
   * Fingerprint of the wishes in review: id, status and note of the AI. Stored as `result_hash` of
   * the run, so the next run can tell whether anything new waits for a decision.
   */
  static getReviewHash(inReview: Pick<FeatureWish, 'id' | 'status' | 'moderation_note_intern'>[]): string {
    const state = inReview.map(wish => ({ id: wish.id, status: wish.status, note: wish.moderation_note_intern ?? null })).sort((a, b) => a.id.localeCompare(b.id));
    return HashHelper.getHashFromObject(state);
  }

  static getDelta(wish: Pick<FeatureWish, 'likes_amount' | 'likes_amount_last_checked'>): number {
    return (wish.likes_amount ?? 0) - (wish.likes_amount_last_checked ?? 0);
  }
}
