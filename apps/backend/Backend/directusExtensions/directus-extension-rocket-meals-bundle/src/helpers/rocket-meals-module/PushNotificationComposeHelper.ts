/**
 * PushNotificationComposeHelper.ts – data side of the page "Push-Nachricht senden" of a profile
 * (`profile-push-page.vue`): how much of title and text a phone shows, the badge number, and the
 * `push_notifications` item that sends the message.
 *
 * Sending itself is done by the `push-notification-hook`: creating a published `push_notifications`
 * item with the Expo push tokens sends it to Expo. The page writes one item for all devices of the
 * profile. No Vue in here, so the rules are testable in Node.
 */

import { CollectionNames } from 'repo-depkit-common/src/databaseTypes/CollectionNames';

export type PushNotificationDraft = {
  title?: string | null;
  body?: string | null;
  /** Raw input of the badge field. */
  badge?: string | number | null;
};

/** A text cut where the phone stops showing it, for the preview. */
export type PushTextVisibility = { visible: string; hidden: string; tooLong: boolean; length: number; limit: number };

export class PushNotificationComposeHelper {
  /**
   * About as many characters as a phone shows of the title in a collapsed notification (one line
   * on the lock screen). Depends on the device and font size, so it is a guide, not a hard limit.
   */
  public static readonly TITLE_VISIBLE_CHARACTERS = 32;
  /** About as many characters of the text as fit into the four lines iOS shows collapsed. */
  public static readonly BODY_VISIBLE_CHARACTERS = 130;
  /** A cut moves back to the last space within this many characters, so no word is split in the preview. */
  public static readonly WORD_SNAP_CHARACTERS = 15;
  /** Lines of the text in the preview – the same four lines the limit above is based on. */
  public static readonly BODY_VISIBLE_LINES = 4;
  /** Larger numbers do not fit on the app icon any more. */
  public static readonly MAX_BADGE = 99_999;

  static readonly PUSH_NOTIFICATIONS_ENDPOINT = `/items/${CollectionNames.PUSH_NOTIFICATIONS}`;

  static getVisibility(text: string | null | undefined, limit: number): PushTextVisibility {
    const value = text ?? '';
    // Array.from: an emoji counts as one character, as the phone shows it.
    const characters = Array.from(value);
    const tooLong = characters.length > limit;
    const cut = tooLong ? PushNotificationComposeHelper.findCut(characters, limit) : characters.length;
    return {
      visible: tooLong ? characters.slice(0, cut).join('') : value,
      hidden: tooLong ? characters.slice(cut).join('') : '',
      tooLong,
      length: characters.length,
      limit,
    };
  }

  /** Where to cut: at the limit, or at the last space shortly before it, so no word is split. */
  private static findCut(characters: readonly string[], limit: number): number {
    for (let index = limit; index >= Math.max(1, limit - PushNotificationComposeHelper.WORD_SNAP_CHARACTERS); index--) {
      if (/\s/.test(characters[index] ?? '')) {
        return index;
      }
    }
    return limit;
  }

  static getTitleVisibility(title: string | null | undefined): PushTextVisibility {
    return PushNotificationComposeHelper.getVisibility(title?.trim(), PushNotificationComposeHelper.TITLE_VISIBLE_CHARACTERS);
  }

  static getBodyVisibility(body: string | null | undefined): PushTextVisibility {
    return PushNotificationComposeHelper.getVisibility(body?.trim(), PushNotificationComposeHelper.BODY_VISIBLE_CHARACTERS);
  }

  /**
   * The badge number of the input: a whole number from 0 to {@link MAX_BADGE}. Empty means "leave
   * the badge as it is" (`undefined`), 0 removes it. Anything else is invalid (`null`).
   */
  static parseBadge(input: string | number | null | undefined): number | undefined | null {
    if (input === null || input === undefined) {
      return undefined;
    }
    const text = String(input).trim();
    if (text === '') {
      return undefined;
    }
    if (!/^\d+$/.test(text)) {
      return null;
    }
    const badge = Number.parseInt(text, 10);
    return badge <= PushNotificationComposeHelper.MAX_BADGE ? badge : null;
  }

  /** What the app icon shows: nothing for no badge or 0. */
  static getBadgeLabel(badge: number | undefined | null): string | undefined {
    return badge ? String(badge) : undefined;
  }

  /** Whether the message can be sent: something to read, a valid badge and at least one device. */
  static canSend(draft: PushNotificationDraft, tokens: readonly string[]): boolean {
    const hasText = !!draft.title?.trim() || !!draft.body?.trim();
    return hasText && PushNotificationComposeHelper.parseBadge(draft.badge) !== null && tokens.length > 0;
  }

  /** The `push_notifications` item: published right away, so the hook sends it to every token. */
  static buildPushNotification(draft: PushNotificationDraft, tokens: readonly string[]) {
    const badge = PushNotificationComposeHelper.parseBadge(draft.badge);
    return {
      expo_push_tokens: [...tokens],
      message_title: draft.title?.trim() || null,
      message_body: draft.body?.trim() || null,
      ios_badge_count: typeof badge === 'number' ? badge : null,
      status: 'published',
    };
  }
}
