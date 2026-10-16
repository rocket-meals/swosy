import { describe, expect, it } from '@jest/globals';
import { DatabaseTypes } from 'repo-depkit-common';
import { PopupEventToNewsMapper } from '../PopupEventToNewsMapper';

describe('PopupEventToNewsMapper', () => {
  const popupEvent = {
    id: 'event-1',
    alias: 'Grillabend',
    status: 'published',
    sort: 3,
    date_start: '2026-10-19T08:00:00',
    date_end: '2026-10-23T20:00:00',
    image: { id: 'file-1' },
    image_remote_url: null,
    image_thumb_hash: 'hash',
    show_on_ios: true,
    show_on_android: false,
    show_on_web: true,
    show_on_app_version: '<21.0.0',
    show_only_anonymous_users: true,
    show_app_rating_button: true,
    show_login_screen_button: false,
    canteens: [
      { id: 1, canteens_id: 'canteen-a', popup_events_id: 'event-1' },
      { id: 2, canteens_id: { id: 'canteen-b' }, popup_events_id: 'event-1' },
      { id: 3, canteens_id: null, popup_events_id: 'event-1' },
    ],
    translations: [
      { id: 1, languages_code: 'de-DE', title: 'Grillabend', content: 'Text', be_source_for_translations: true, let_be_translated: false, translation_settings: '' },
      { id: 2, languages_code: { code: 'en-US' }, title: 'Barbecue', content: 'Text', translation_settings: '' },
      { id: 3, languages_code: null, title: 'ohne Sprache', translation_settings: '' },
    ],
  } as unknown as DatabaseTypes.PopupEvents;

  it('maps the popup event to a popup news', () => {
    const news = PopupEventToNewsMapper.mapToNews(popupEvent);

    expect(news).toMatchObject({
      alias: 'Grillabend',
      status: 'published',
      sort: 3,
      date: '2026-10-19T08:00:00',
      date_end: '2026-10-23T20:00:00',
      image: 'file-1',
      image_thumb_hash: 'hash',
      display_locations: ['popup'],
      show_on_ios: true,
      show_on_android: false,
      show_on_web: true,
      show_on_app_version: '<21.0.0',
      show_only_anonymous_users: true,
      show_app_rating_button: true,
      show_login_screen_button: false,
    });
  });

  it('keeps the canteens as junction rows, ids or resolved', () => {
    expect(PopupEventToNewsMapper.mapToNews(popupEvent).canteens).toEqual([{ canteens_id: 'canteen-a' }, { canteens_id: 'canteen-b' }]);
  });

  it('copies the translations with a language', () => {
    expect(PopupEventToNewsMapper.mapToNews(popupEvent).translations).toEqual([
      { languages_code: 'de-DE', title: 'Grillabend', content: 'Text', be_source_for_translations: true, let_be_translated: false },
      { languages_code: 'en-US', title: 'Barbecue', content: 'Text', be_source_for_translations: undefined, let_be_translated: undefined },
    ]);
  });
});
