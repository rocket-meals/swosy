import { describe, expect, it } from '@jest/globals';
import { ChatConversationState } from '../ChatConversationState';
import { ChatHelper } from '../ChatHelper';

describe('ChatHelper', () => {
  it('tells support messages from user messages by the profile', () => {
    expect(ChatHelper.isSupportMessage({ profile: null })).toBe(true);
    expect(ChatHelper.isSupportMessage({})).toBe(true);
    expect(ChatHelper.isSupportMessage({ profile: 'profile-id' })).toBe(false);
    expect(ChatHelper.isSupportMessage({ profile: { id: 'profile-id' } })).toBe(false);
  });

  it('waits for the other side after a message', () => {
    expect(ChatHelper.getConversationStateAfterMessage(true)).toBe(ChatConversationState.WAITING_FOR_USER);
    expect(ChatHelper.getConversationStateAfterMessage(false)).toBe(ChatConversationState.WAITING_FOR_SUPPORT);
  });

  it('sorts messages oldest first without changing the input', () => {
    const messages = [
      { id: 'c', date_created: '2026-10-06T10:00:00Z' },
      { id: 'a', date_created: '2026-10-06T08:00:00Z' },
      { id: 'b', date_created: null, date_updated: '2026-10-06T09:00:00Z' },
    ];
    expect(ChatHelper.sortMessagesChronologically(messages).map(message => message.id)).toEqual(['a', 'b', 'c']);
    expect(messages.map(message => message.id)).toEqual(['c', 'a', 'b']);
  });

  it('builds a new support chat waiting for support', () => {
    expect(ChatHelper.buildSupportChat({ alias: 'Feedback zu Pasta', initialMessage: '  Zu salzig  ' })).toEqual({
      alias: 'Feedback zu Pasta',
      initial_message: 'Zu salzig',
      conversation_state: ChatConversationState.WAITING_FOR_SUPPORT,
    });
    expect(ChatHelper.buildSupportChat({ alias: 'x', initialMessage: '   ' }).initial_message).toBeNull();
    expect(ChatHelper.buildSupportChat({ alias: 'x' }).initial_message).toBeNull();
  });

  it('builds the participant row', () => {
    expect(ChatHelper.buildParticipant('chat-id', 'profile-id')).toEqual({ chats_id: 'chat-id', profiles_id: 'profile-id' });
  });
});
