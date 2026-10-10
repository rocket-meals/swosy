import { describe, expect, it } from '@jest/globals';

import { ChatMailDigestHelper } from '../ChatMailDigestHelper';

type Message = { id: string; profile: string | null; message?: string | null };

const messages: Message[] = [
  { id: '1', profile: 'user', message: 'Hallo' },
  { id: '2', profile: null, message: 'Hi, was ist los?' },
  { id: '3', profile: 'user', message: 'Die App stürzt ab' },
  { id: '4', profile: 'user', message: 'Beim Start' },
];

const ids = (list: Message[]) => list.map(message => message.id);

describe('ChatMailDigestHelper.getUnseenMessages', () => {
  it('only contains what others wrote after the last own message', () => {
    expect(ids(ChatMailDigestHelper.getUnseenMessages(messages, message => message.profile === null))).toEqual(['3', '4']);
  });

  it('is empty when the recipient wrote last', () => {
    expect(ChatMailDigestHelper.getUnseenMessages(messages, message => message.profile === 'user')).toEqual([]);
  });

  it('contains everything when the recipient wrote nothing', () => {
    expect(ids(ChatMailDigestHelper.getUnseenMessages(messages, message => message.profile === 'friend'))).toEqual(['1', '2', '3', '4']);
    expect(ChatMailDigestHelper.getUnseenMessages([], () => false)).toEqual([]);
  });
});

describe('ChatMailDigestHelper.joinMessages', () => {
  it('puts every text in its own paragraph and leaves out messages without text', () => {
    expect(ChatMailDigestHelper.joinMessages([{ message: ' Die App stürzt ab ' }, { message: null }, { message: '  ' }, { message: 'Beim Start' }])).toBe('Die App stürzt ab\n\nBeim Start');
    expect(ChatMailDigestHelper.joinMessages([{ message: null }])).toBe('');
  });
});

describe('ChatMailDigestHelper.getQuietCutoff', () => {
  it('lies the quiet time before now', () => {
    const now = new Date('2026-10-10T10:00:00.000Z');
    expect(ChatMailDigestHelper.getQuietCutoff(now)).toBe('2026-10-10T09:55:00.000Z');
  });
});
