/**
 * ChatMailRecipientHelper.ts – decides where the mail about a new chat message goes, before it is
 * sent: to the address of the other participant, to support, or nowhere.
 *
 * - A guest account (`guest-…@guest.example.com`) or any other address under `example.com` has no
 *   mailbox (RFC 2606) – there is nobody to mail.
 * - The Directus default admin `admin@example.com` stands for support: its mail goes to the
 *   support address instead.
 * - Every other valid address gets the mail itself.
 *
 * Plain logic without Directus imports, so it can be unit tested in Node.
 */

import { EmailHelper, GuestAccountHelper } from 'repo-depkit-common';

export enum ChatMailRecipientKind {
  /** Mail this address. */
  USER = 'user',
  /** Mail support instead. */
  SUPPORT = 'support',
  /** No mail. */
  NONE = 'none',
}

export type ChatMailRecipient = { kind: ChatMailRecipientKind.USER; email: string } | { kind: ChatMailRecipientKind.SUPPORT } | { kind: ChatMailRecipientKind.NONE };

export class ChatMailRecipientHelper {
  /** The address Directus gives its first admin when `ADMIN_EMAIL` is not set. */
  static readonly DEFAULT_ADMIN_EMAIL = 'admin@example.com';

  /** Reserved for examples, it never has a mailbox (RFC 2606). */
  static readonly RESERVED_DOMAIN = 'example.com';

  static classify(email: string | null | undefined): ChatMailRecipient {
    const { trimmedEmail, isValid } = EmailHelper.sanitizeAndValidate(email ?? '');
    if (!isValid) {
      return { kind: ChatMailRecipientKind.NONE };
    }
    const normalizedEmail = trimmedEmail.toLowerCase();
    if (normalizedEmail === ChatMailRecipientHelper.DEFAULT_ADMIN_EMAIL) {
      return { kind: ChatMailRecipientKind.SUPPORT };
    }
    if (GuestAccountHelper.isGuestEmail(normalizedEmail) || ChatMailRecipientHelper.isReservedEmail(normalizedEmail)) {
      return { kind: ChatMailRecipientKind.NONE };
    }
    return { kind: ChatMailRecipientKind.USER, email: trimmedEmail };
  }

  /** Whether an address is under `example.com` or one of its subdomains. */
  static isReservedEmail(email: string): boolean {
    const domain = email.trim().toLowerCase().split('@').pop() ?? '';
    return domain === ChatMailRecipientHelper.RESERVED_DOMAIN || domain.endsWith('.' + ChatMailRecipientHelper.RESERVED_DOMAIN);
  }
}
