import { describe, expect, it } from '@jest/globals';
import { FoodFeedbackChatFilter } from 'repo-depkit-common';
import { AppFeedbackChatHelper } from '../AppFeedbackChatHelper';
import { ChatQueryHelper } from '../ChatQueryHelper';
import { FoodFeedbackChatHelper } from '../FoodFeedbackChatHelper';
import { OpenCountHelper } from '../OpenCountHelper';
import { RocketMealsModulePages } from '../RocketMealsModulePages';

describe('OpenCountHelper', () => {
  describe('getRequest', () => {
    it('counts open food feedbacks like the chip "Offen" of their page', () => {
      expect(OpenCountHelper.getRequest(RocketMealsModulePages.FOOD_FEEDBACKS)).toEqual({
        endpoint: FoodFeedbackChatHelper.FOOD_FEEDBACKS_ENDPOINT,
        params: FoodFeedbackChatHelper.buildCountQuery(FoodFeedbackChatFilter.OPEN),
      });
    });

    it('counts open app feedbacks like the chip "Offen" of their page', () => {
      expect(OpenCountHelper.getRequest(RocketMealsModulePages.APP_FEEDBACKS)).toEqual({
        endpoint: AppFeedbackChatHelper.APP_FEEDBACKS_ENDPOINT,
        params: AppFeedbackChatHelper.buildCountQuery(FoodFeedbackChatFilter.OPEN),
      });
    });

    it('counts open chats without feedback', () => {
      const request = OpenCountHelper.getRequest(RocketMealsModulePages.CHATS);
      expect(request?.endpoint).toBe(ChatQueryHelper.CHATS_ENDPOINT);
      expect(JSON.parse(request!.params.aggregate!)).toEqual({ count: ['id'] });
      expect(JSON.parse(request!.params.filter!)).toEqual(ChatQueryHelper.buildChatsFilter({ withoutFeedbackChats: true, status: FoodFeedbackChatFilter.OPEN }));
    });

    it('has no request for pages without open items', () => {
      const pagesWithCount = [RocketMealsModulePages.FOOD_FEEDBACKS, RocketMealsModulePages.APP_FEEDBACKS, RocketMealsModulePages.CHATS];
      RocketMealsModulePages.PAGES.filter(page => !pagesWithCount.includes(page)).forEach(page => {
        expect(OpenCountHelper.getRequest(page)).toBeUndefined();
      });
    });
  });

  describe('parseCount', () => {
    it('reads the count of an aggregate response, also as string', () => {
      expect(OpenCountHelper.parseCount({ data: [{ count: { id: 3 } }] })).toBe(3);
      expect(OpenCountHelper.parseCount({ data: [{ count: { id: '12' } }] })).toBe(12);
      expect(OpenCountHelper.parseCount({ data: [{ count: '5' }] })).toBe(5);
    });

    it('returns undefined without a count', () => {
      expect(OpenCountHelper.parseCount(undefined)).toBeUndefined();
      expect(OpenCountHelper.parseCount({ data: [] })).toBeUndefined();
      expect(OpenCountHelper.parseCount({ data: [{ count: { id: 'x' } }] })).toBeUndefined();
    });
  });

  describe('getBadgeText', () => {
    it('shows nothing when nothing is open', () => {
      expect(OpenCountHelper.getBadgeText(undefined)).toBeUndefined();
      expect(OpenCountHelper.getBadgeText(0)).toBeUndefined();
    });

    it('shows the count, capped at 99+', () => {
      expect(OpenCountHelper.getBadgeText(1)).toBe('1');
      expect(OpenCountHelper.getBadgeText(99)).toBe('99');
      expect(OpenCountHelper.getBadgeText(100)).toBe('99+');
    });
  });
});
