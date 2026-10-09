import { describe, expect, it } from '@jest/globals';
import { FoodFeedbackChatFilter, FoodFeedbackChatStatus } from 'repo-depkit-common';
import { ChatQueryHelper, ModuleChatKind } from '../ChatQueryHelper';
import { ProfileChatActions } from '../ProfileChatActions';
import { ProfileDetailsHelper } from '../ProfileDetailsHelper';
import { PushNotificationComposeHelper } from '../PushNotificationComposeHelper';
import { RocketMealsModulePages } from '../RocketMealsModulePages';

const TOKEN_A = 'ExponentPushToken[aaa]';
const TOKEN_B = 'ExponentPushToken[bbb]';

function pushTokenObj(token: string) {
  return { pushtokenObj: { data: token } };
}

describe('RocketMealsModulePages – profiles and chats', () => {
  it('lists the new pages and builds the profile routes', () => {
    expect(RocketMealsModulePages.PAGES).toContain(RocketMealsModulePages.PROFILES);
    expect(RocketMealsModulePages.PAGES).toContain(RocketMealsModulePages.CHATS);
    expect(RocketMealsModulePages.getProfileRoute('p 1')).toBe('/rocket-meals/profiles/p%201');
    expect(ProfileDetailsHelper.getChatRoute('p1')).toBe('/rocket-meals/profiles/p1/chat');
    expect(ProfileDetailsHelper.getPushRoute('p1')).toBe('/rocket-meals/profiles/p1/push');
    expect(ProfileDetailsHelper.getRoute({ id: 'p1' })).toBe('/rocket-meals/profiles/p1');
    expect(ProfileDetailsHelper.getRoute('p1')).toBe('/rocket-meals/profiles/p1');
    expect(ProfileDetailsHelper.getRoute(null)).toBeUndefined();
  });
});

describe('ProfileDetailsHelper', () => {
  it('searches by nickname, and by id only for a complete UUID', () => {
    expect(ProfileDetailsHelper.buildSearchFilter('  ')).toBeUndefined();
    expect(ProfileDetailsHelper.buildSearchFilter('Curie')).toEqual({ nickname: { _icontains: 'Curie' } });
    const uuid = '0f8fad5b-d9cb-469f-a165-70867728950e';
    expect(ProfileDetailsHelper.buildSearchFilter(uuid)).toEqual({ _or: [{ nickname: { _icontains: uuid } }, { id: { _eq: uuid } }] });
  });

  it('lists the most recently active profiles without search', () => {
    const query = ProfileDetailsHelper.buildSearchQuery('', 0);
    expect(query.filter).toBeUndefined();
    expect(query.sort).toBe('-date_updated');
    expect(query.page).toBe(1);
    expect(ProfileDetailsHelper.getPageCount(26)).toBe(2);
    expect(ProfileDetailsHelper.getPageCount(0)).toBe(1);
  });

  it('reads the push tokens of the devices, once per token', () => {
    const devices = [
      { id: 'd1', pushTokenObj: pushTokenObj(TOKEN_A) },
      { id: 'd2', pushTokenObj: JSON.stringify(pushTokenObj(TOKEN_A)) },
      { id: 'd3', pushTokenObj: pushTokenObj(TOKEN_B) },
      { id: 'd4', pushTokenObj: null },
      { id: 'd5', pushTokenObj: 'not json' },
    ];
    expect(ProfileDetailsHelper.getPushTokens(devices)).toEqual([TOKEN_A, TOKEN_B]);
    expect(ProfileDetailsHelper.getPushToken(devices[3]!)).toBeUndefined();
  });

  it('describes a device and picks its icon', () => {
    expect(ProfileDetailsHelper.getDeviceDescription({ id: 'd', brand: 'Apple', platform: 'ios', system_version: '18.2' })).toBe('Apple · ios 18.2');
    expect(ProfileDetailsHelper.getDeviceDescription({ id: 'd' })).toBeUndefined();
    expect(ProfileDetailsHelper.getDeviceIcon({ id: 'd', is_ios: true })).toBe('phone_iphone');
    expect(ProfileDetailsHelper.getDeviceIcon({ id: 'd', is_web: true, is_ios: true })).toBe('language');
  });

  it('reads language and canteen of a profile in both shapes', () => {
    expect(ProfileDetailsHelper.getLanguageCode({ id: 'p', language: 'de-DE' })).toBe('de-DE');
    expect(ProfileDetailsHelper.getLanguageCode({ id: 'p', language: { code: 'en-US' } })).toBe('en-US');
    expect(ProfileDetailsHelper.getCanteenName({ id: 'p', canteen: { id: 'c1', alias: 'Mensa' } })).toBe('Mensa');
  });
});

describe('ChatQueryHelper', () => {
  it('loads the messages of a chat oldest first, with the avatar of the profile', () => {
    const query = ChatQueryHelper.buildMessagesQuery('c1');
    expect(JSON.parse(String(query.filter))).toEqual({ chat: { _eq: 'c1' } });
    expect(query.sort).toBe('date_created');
    expect(String(query.fields)).toContain('profile.avatar');
    expect(ChatQueryHelper.buildLatestMessageQuery('c1').sort).toBe('-date_created');
  });

  it('combines the filters of a chat list', () => {
    expect(ChatQueryHelper.buildChatsFilter()).toBeUndefined();
    expect(ChatQueryHelper.buildChatsFilter({ profileId: 'p1' })).toEqual({ participants: { _some: { profiles_id: { _eq: 'p1' } } } });
    const filter = ChatQueryHelper.buildChatsFilter({ withoutFeedbackChats: true, status: FoodFeedbackChatFilter.WAITING_FOR_USER, search: ' Hallo ' });
    expect(filter).toEqual({
      _and: [{ food_feedbacks: { _none: { id: { _nnull: true } } } }, { app_feedbacks: { _none: { id: { _nnull: true } } } }, { conversation_state: { _eq: 'waiting_for_user' } }, { alias: { _icontains: 'Hallo' } }],
    });
    expect(ChatQueryHelper.buildStatusFilter(FoodFeedbackChatFilter.OPEN)).toEqual({ _or: [{ conversation_state: { _null: true } }, { conversation_state: { _eq: 'waiting_for_support' } }] });
    expect(ChatQueryHelper.buildStatusFilter(FoodFeedbackChatFilter.ALL)).toBeUndefined();
  });

  it('sends a chat to the page that answers it', () => {
    expect(ChatQueryHelper.getRoute({ id: 'c1', food_feedbacks: [{ id: 'f1' }] })).toBe('/rocket-meals/food-feedbacks/f1');
    expect(ChatQueryHelper.getRoute({ id: 'c1', app_feedbacks: ['a1'] })).toBe('/rocket-meals/app-feedbacks/a1');
    expect(ChatQueryHelper.getRoute({ id: 'c1', food_feedbacks: [], app_feedbacks: [] })).toBe('/rocket-meals/chats/c1');
    expect(ChatQueryHelper.getKind({ id: 'c1' })).toBe(ModuleChatKind.OTHER);
  });

  it('reads participants and status of a chat', () => {
    const chat = { id: 'c1', conversation_state: 'waiting_for_user', participants: [{ profiles_id: { id: 'p1', nickname: 'Ada' } }, { profiles_id: 'p2' }] };
    expect(ChatQueryHelper.getProfiles(chat)).toEqual([{ id: 'p1', nickname: 'Ada' }]);
    expect(ChatQueryHelper.getStatus(chat)).toBe(FoodFeedbackChatStatus.WAITING_FOR_USER);
    expect(ChatQueryHelper.getStatus({ id: 'c2' })).toBe(FoodFeedbackChatStatus.WAITING_FOR_SUPPORT);
  });
});

describe('ProfileChatActions', () => {
  it('creates the chat with the first message, in the language of the profile', async () => {
    const calls: { method: string; url: string; data: unknown }[] = [];
    const api = {
      post: async (url: string, data?: unknown) => {
        calls.push({ method: 'post', url, data });
        return { data: { data: { id: 'c9' } } };
      },
      patch: async (url: string, data?: unknown) => {
        calls.push({ method: 'patch', url, data });
        return { data: {} };
      },
    };
    const chatId = await ProfileChatActions.startChat(api, { id: 'p1', language: 'en-US' }, 'Hello');
    expect(chatId).toBe('c9');
    expect(calls.map(call => `${call.method} ${call.url}`)).toEqual([`post ${ChatQueryHelper.CHATS_ENDPOINT}`, `post ${ChatQueryHelper.CHATS_PARTICIPANTS_ENDPOINT}`, `post ${ChatQueryHelper.CHAT_MESSAGES_ENDPOINT}`, `patch ${ChatQueryHelper.CHATS_ENDPOINT}/c9`]);
    expect((calls[0]!.data as { alias: string }).alias).toBe('Message from the team');
    expect(calls[1]!.data).toEqual({ chats_id: 'c9', profiles_id: 'p1' });
    expect(calls[2]!.data).toEqual({ chat: 'c9', message: 'Hello' });
    expect(calls[3]!.data).toEqual({ conversation_state: 'waiting_for_user' });
  });
});

describe('PushNotificationComposeHelper', () => {
  it('marks the part of a text a phone cuts off', () => {
    const short = PushNotificationComposeHelper.getTitleVisibility('Heute Pizza');
    expect(short).toEqual({ visible: 'Heute Pizza', hidden: '', tooLong: false, length: 11, limit: PushNotificationComposeHelper.TITLE_VISIBLE_CHARACTERS });
    const long = PushNotificationComposeHelper.getVisibility('abcdef', 4);
    expect(long).toEqual({ visible: 'abcd', hidden: 'ef', tooLong: true, length: 6, limit: 4 });
    // An emoji counts as one character.
    expect(PushNotificationComposeHelper.getVisibility('🍕🍕🍕', 2).hidden).toBe('🍕');
  });

  it('reads the badge: empty keeps it, 0 removes it, anything else but a whole number is invalid', () => {
    expect(PushNotificationComposeHelper.parseBadge('')).toBeUndefined();
    expect(PushNotificationComposeHelper.parseBadge(null)).toBeUndefined();
    expect(PushNotificationComposeHelper.parseBadge('0')).toBe(0);
    expect(PushNotificationComposeHelper.parseBadge(' 12 ')).toBe(12);
    expect(PushNotificationComposeHelper.parseBadge(3)).toBe(3);
    expect(PushNotificationComposeHelper.parseBadge('-1')).toBeNull();
    expect(PushNotificationComposeHelper.parseBadge('1.5')).toBeNull();
    expect(PushNotificationComposeHelper.parseBadge(String(PushNotificationComposeHelper.MAX_BADGE + 1))).toBeNull();
    expect(PushNotificationComposeHelper.getBadgeLabel(0)).toBeUndefined();
    expect(PushNotificationComposeHelper.getBadgeLabel(7)).toBe('7');
  });

  it('can only send with a text, a valid badge and a device', () => {
    expect(PushNotificationComposeHelper.canSend({ title: 'Hi' }, [TOKEN_A])).toBe(true);
    expect(PushNotificationComposeHelper.canSend({ title: ' ', body: '' }, [TOKEN_A])).toBe(false);
    expect(PushNotificationComposeHelper.canSend({ body: 'Hi', badge: 'x' }, [TOKEN_A])).toBe(false);
    expect(PushNotificationComposeHelper.canSend({ body: 'Hi' }, [])).toBe(false);
  });

  it('builds one published push notification for all tokens', () => {
    expect(PushNotificationComposeHelper.buildPushNotification({ title: ' Hi ', body: '', badge: '2' }, [TOKEN_A, TOKEN_B])).toEqual({
      expo_push_tokens: [TOKEN_A, TOKEN_B],
      message_title: 'Hi',
      message_body: null,
      ios_badge_count: 2,
      status: 'published',
    });
    expect(PushNotificationComposeHelper.buildPushNotification({ body: 'Text' }, [TOKEN_A]).ios_badge_count).toBeNull();
  });
});
