import { describe, expect, it } from '@jest/globals';
import { GuestAccountHelper } from 'repo-depkit-common';

import { ChatMailRecipientHelper, ChatMailRecipientKind } from '../ChatMailRecipientHelper';

describe('ChatMailRecipientHelper.classify', () => {
  it('mails a real address, trimmed', () => {
    expect(ChatMailRecipientHelper.classify('  user@studentenwerk.de ')).toEqual({ kind: ChatMailRecipientKind.USER, email: 'user@studentenwerk.de' });
  });

  it('mails nobody without a valid address', () => {
    expect(ChatMailRecipientHelper.classify(null)).toEqual({ kind: ChatMailRecipientKind.NONE });
    expect(ChatMailRecipientHelper.classify('   ')).toEqual({ kind: ChatMailRecipientKind.NONE });
    expect(ChatMailRecipientHelper.classify('not-an-email')).toEqual({ kind: ChatMailRecipientKind.NONE });
  });

  it('mails nobody for guests and other example.com addresses', () => {
    expect(ChatMailRecipientHelper.classify(GuestAccountHelper.buildEmail('abc123'))).toEqual({ kind: ChatMailRecipientKind.NONE });
    expect(ChatMailRecipientHelper.classify('someone@example.com')).toEqual({ kind: ChatMailRecipientKind.NONE });
    expect(ChatMailRecipientHelper.classify('mcp-public@mcp.example.com')).toEqual({ kind: ChatMailRecipientKind.NONE });
    // Only the domain itself and its subdomains are reserved.
    expect(ChatMailRecipientHelper.classify('user@notexample.com')).toEqual({ kind: ChatMailRecipientKind.USER, email: 'user@notexample.com' });
  });

  it('mails support for the Directus default admin', () => {
    expect(ChatMailRecipientHelper.classify('admin@example.com')).toEqual({ kind: ChatMailRecipientKind.SUPPORT });
    expect(ChatMailRecipientHelper.classify(' Admin@Example.com ')).toEqual({ kind: ChatMailRecipientKind.SUPPORT });
  });
});
