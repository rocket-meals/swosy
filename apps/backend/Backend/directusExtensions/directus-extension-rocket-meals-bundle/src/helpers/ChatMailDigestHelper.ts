/**
 * ChatMailDigestHelper.ts – the rules for the delayed mails about chat messages.
 *
 * A message does not send a mail right away: the `chat-conversation-state-hook` only notes in
 * `chats.mail_pending_since` that there is something to mail. Once the chat was quiet for
 * {@link QUIET_MINUTES} (`chats.date_updated`, which every message bumps), the
 * `chat-mail-schedule` sends one mail per recipient with everything they have not seen yet. An
 * active conversation therefore sends no mail at all, and a burst of messages only one.
 *
 * Plain logic without Directus imports, so it can be unit tested in Node.
 */

export class ChatMailDigestHelper {
  /** How long a chat has to be quiet before its mails go out. */
  static readonly QUIET_MINUTES = 5;

  /** Chats last changed before this point in time are quiet. */
  static getQuietCutoff(now: Date): string {
    return new Date(now.getTime() - ChatMailDigestHelper.QUIET_MINUTES * 60 * 1000).toISOString();
  }

  /**
   * The messages a recipient has not seen: those written by others after the recipient's own last
   * message. Whoever answered in the meantime was obviously there and gets no mail. `messages`
   * must be sorted oldest first.
   */
  static getUnseenMessages<T>(messages: readonly T[], isOwn: (message: T) => boolean): T[] {
    let lastOwnIndex = -1;
    messages.forEach((message, index) => {
      if (isOwn(message)) {
        lastOwnIndex = index;
      }
    });
    return messages.slice(lastOwnIndex + 1);
  }

  /** The texts of the messages, one paragraph each. Messages without text (e.g. only an image) are left out. */
  static joinMessages(messages: readonly { message?: string | null }[]): string {
    return messages
      .map(message => (message.message ?? '').trim())
      .filter(text => text.length > 0)
      .join('\n\n');
  }
}
