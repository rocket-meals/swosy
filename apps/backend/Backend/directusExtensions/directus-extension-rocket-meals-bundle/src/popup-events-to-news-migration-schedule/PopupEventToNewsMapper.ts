import { DatabaseTypes, NewsDisplayLocations } from 'repo-depkit-common';

/**
 * Popup events and news were merged: a popup event is now a news with `display_locations` "popup".
 * This maps one popup event (loaded with `translations.*` and `canteens.*`) to the news to create,
 * including its translations and canteens as nested relations.
 */
export class PopupEventToNewsMapper {
  static mapToNews(popupEvent: DatabaseTypes.PopupEvents): Partial<DatabaseTypes.News> {
    return {
      alias: popupEvent.alias,
      status: popupEvent.status,
      sort: popupEvent.sort,
      date: popupEvent.date_start,
      date_end: popupEvent.date_end,
      image: PopupEventToNewsMapper.getId(popupEvent.image),
      image_remote_url: popupEvent.image_remote_url,
      image_thumb_hash: popupEvent.image_thumb_hash,
      display_locations: [NewsDisplayLocations.popup],
      show_on_ios: popupEvent.show_on_ios,
      show_on_android: popupEvent.show_on_android,
      show_on_web: popupEvent.show_on_web,
      show_on_app_version: popupEvent.show_on_app_version,
      show_only_anonymous_users: popupEvent.show_only_anonymous_users,
      show_app_rating_button: popupEvent.show_app_rating_button,
      show_login_screen_button: popupEvent.show_login_screen_button,
      canteens: PopupEventToNewsMapper.mapCanteens(popupEvent),
      translations: PopupEventToNewsMapper.mapTranslations(popupEvent),
    };
  }

  private static getId(value: string | { id: string } | null | undefined): string | null {
    if (!value) {
      return null;
    }
    return typeof value === 'object' ? value.id : value;
  }

  private static mapCanteens(popupEvent: DatabaseTypes.PopupEvents): Partial<DatabaseTypes.NewsCanteens>[] {
    const entries = Array.isArray(popupEvent.canteens) ? (popupEvent.canteens as DatabaseTypes.PopupEventsCanteens[]) : [];
    return entries
      .map(entry => PopupEventToNewsMapper.getId(entry?.canteens_id as string | { id: string } | null | undefined))
      .filter((canteenId): canteenId is string => !!canteenId)
      .map(canteenId => ({ canteens_id: canteenId }));
  }

  private static mapTranslations(popupEvent: DatabaseTypes.PopupEvents): Partial<DatabaseTypes.NewsTranslations>[] {
    const entries = Array.isArray(popupEvent.translations) ? (popupEvent.translations as DatabaseTypes.PopupEventsTranslations[]) : [];
    return entries
      .filter(entry => !!entry?.languages_code)
      .map(entry => ({
        languages_code: PopupEventToNewsMapper.getLanguageCode(entry.languages_code),
        title: entry.title,
        content: entry.content,
        be_source_for_translations: entry.be_source_for_translations,
        let_be_translated: entry.let_be_translated,
      }));
  }

  private static getLanguageCode(value: string | DatabaseTypes.Languages | null | undefined): string | null {
    if (!value) {
      return null;
    }
    return typeof value === 'object' ? value.code : value;
  }
}
