import * as DatabaseTypes from './databaseTypes/types';

export type NewsPlatformKey = 'show_on_ios' | 'show_on_android' | 'show_on_web';

/**
 * news.display_locations (csv) decides where a news is shown in the app, several at once are possible:
 * - news_list: in the list of the news screen (also for news without a value, e.g. imported ones)
 * - popup: as a sheet that opens on its own over the food offers
 * - foodoffers_top: as a compact card above the food offers
 * - foodoffers_bottom: as a compact card below the food offers of the first day
 */
export const NewsDisplayLocations = {
  news_list: 'news_list',
  popup: 'popup',
  foodoffers_top: 'foodoffers_top',
  foodoffers_bottom: 'foodoffers_bottom',
} as const;
export type NewsDisplayLocation = (typeof NewsDisplayLocations)[keyof typeof NewsDisplayLocations];

export const NewsFoodoffersPositions = {
  top: 'top',
  bottom: 'bottom',
} as const;
export type NewsFoodoffersPosition = (typeof NewsFoodoffersPositions)[keyof typeof NewsFoodoffersPositions];

type NewsDisplayFields = Pick<DatabaseTypes.News, 'display_locations'>;
type NewsDateFields = Pick<DatabaseTypes.News, 'date' | 'date_end'>;
type NewsCanteenFields = Pick<DatabaseTypes.News, 'canteens'>;
type NewsAppFields = Pick<
  DatabaseTypes.News,
  'display_locations' | 'date' | 'date_end' | 'show_on_ios' | 'show_on_android' | 'show_on_web' | 'show_on_app_version' | 'show_only_anonymous_users'
>;

const KNOWN_LOCATIONS: readonly string[] = Object.values(NewsDisplayLocations);

/**
 * The locations of a news. Directus sends the csv field as array, a plain string is split as well.
 * Unknown values are ignored, nothing left means the news list.
 */
export const getNewsDisplayLocations = (news: NewsDisplayFields): NewsDisplayLocation[] => {
  const raw = news.display_locations;
  const values = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(',') : [];
  const locations = values.map((value) => String(value).trim()).filter((value): value is NewsDisplayLocation => KNOWN_LOCATIONS.includes(value));
  return locations.length > 0 ? locations : [NewsDisplayLocations.news_list];
};

export const isNewsShownAt = (news: NewsDisplayFields, location: NewsDisplayLocation): boolean => {
  return getNewsDisplayLocations(news).includes(location);
};

export const getNewsFoodoffersLocation = (position: NewsFoodoffersPosition): NewsDisplayLocation => {
  return position === NewsFoodoffersPositions.top ? NewsDisplayLocations.foodoffers_top : NewsDisplayLocations.foodoffers_bottom;
};

/** Shown as popup or as card in the food offers, i.e. somewhere outside the news list. */
export const isNewsShownOutsideNewsList = (news: NewsDisplayFields): boolean => {
  return getNewsDisplayLocations(news).some((location) => location !== NewsDisplayLocations.news_list);
};

/**
 * The time a news is visible: from `date` until `date_end`, both optional. The news list only uses the
 * end, `date` stays the date the news is about there (imported news may carry a date in the future).
 */
export const isNewsVisibleAtTime = (news: NewsDateFields, referenceDate: Date = new Date(), ignoreStart: boolean = false): boolean => {
  const start = !ignoreStart && news.date ? new Date(news.date) : null;
  const end = news.date_end ? new Date(news.date_end) : null;
  if (start && referenceDate < start) {
    return false;
  }
  if (end && referenceDate > end) {
    return false;
  }
  return true;
};

/** For the news screen: shown in the list and not ended yet. */
export const isNewsShownInNewsList = (news: NewsDisplayFields & NewsDateFields, referenceDate: Date = new Date()): boolean => {
  return isNewsShownAt(news, NewsDisplayLocations.news_list) && isNewsVisibleAtTime(news, referenceDate, true);
};

const VERSION_CONSTRAINT_REGEX = /^(<=|>=|<|>|=)?\s*(\d+(?:\.\d+)*)$/;

export const compareAppVersions = (a: string, b: string): number => {
  const partsA = a.split('.').map((part) => Number.parseInt(part, 10) || 0);
  const partsB = b.split('.').map((part) => Number.parseInt(part, 10) || 0);
  const length = Math.max(partsA.length, partsB.length);

  for (let i = 0; i < length; i++) {
    const numA = partsA[i] ?? 0;
    const numB = partsB[i] ?? 0;
    if (numA !== numB) {
      return numA < numB ? -1 : 1;
    }
  }
  return 0;
};

/**
 * show_on_app_version holds an optional constraint like "<20.195.4", ">=21.0.0" or "21.0.0" (exact match).
 * A missing/blank constraint means the event is shown on every version. A constraint that can't be
 * parsed, or a missing currentAppVersion to compare against, fails open (event stays visible) since
 * that matches the previous behaviour of not filtering at all.
 */
export const doesAppVersionMatchConstraint = (
  constraint: string | null | undefined,
  currentAppVersion?: string | null
): boolean => {
  const trimmedConstraint = constraint?.trim();
  if (!trimmedConstraint) {
    return true;
  }
  if (!currentAppVersion) {
    return true;
  }

  const match = VERSION_CONSTRAINT_REGEX.exec(trimmedConstraint);
  if (!match) {
    console.warn(`News: could not parse show_on_app_version constraint "${constraint}"`);
    return true;
  }

  const [, operator = '=', targetVersion] = match;
  if (!targetVersion) {
    console.warn(`News: could not parse show_on_app_version constraint "${constraint}"`);
    return true;
  }
  const comparison = compareAppVersions(currentAppVersion, targetVersion);

  switch (operator) {
    case '<':
      return comparison < 0;
    case '<=':
      return comparison <= 0;
    case '>':
      return comparison > 0;
    case '>=':
      return comparison >= 0;
    case '=':
    default:
      return comparison === 0;
  }
};

/**
 * show_only_anonymous_users restricts a news to users without an account (the app's
 * "continue without account" mode). Guests and registered users have an account and don't see it.
 */
export const doesNewsMatchUser = (news: Pick<DatabaseTypes.News, 'show_only_anonymous_users'>, isAnonymousUser: boolean): boolean => {
  if (news.show_only_anonymous_users) {
    return isAnonymousUser;
  }
  return true;
};

/** A platform flag without a value (e.g. imported news) counts as shown, only an explicit false hides it. */
export const doesNewsMatchPlatform = (news: Pick<DatabaseTypes.News, NewsPlatformKey>, platformKey: NewsPlatformKey): boolean => {
  return news[platformKey] !== false;
};

/**
 * The news the app shows as popup or as card in the food offers right now: one of those locations,
 * inside its time, on this platform, app version and kind of user.
 */
export const filterNewsShownOutsideNewsList = <T extends NewsAppFields>(
  newsList: T[],
  platformKey: NewsPlatformKey,
  referenceDate: Date = new Date(),
  currentAppVersion?: string | null,
  isAnonymousUser: boolean = false
): T[] => {
  return newsList.filter(
    (news) =>
      isNewsShownOutsideNewsList(news) &&
      isNewsVisibleAtTime(news, referenceDate) &&
      doesNewsMatchPlatform(news, platformKey) &&
      doesAppVersionMatchConstraint(news.show_on_app_version, currentAppVersion) &&
      doesNewsMatchUser(news, isAnonymousUser)
  );
};

/**
 * The canteen ids of a news' news_canteens junction rows, whether they were loaded as ids or with the
 * related canteen resolved.
 */
export const getNewsCanteenIds = (news: NewsCanteenFields): string[] => {
  const entries = Array.isArray(news.canteens) ? news.canteens : [];
  return entries
    .map((entry) => {
      const canteen = entry && typeof entry === 'object' ? (entry as DatabaseTypes.NewsCanteens).canteens_id : null;
      if (canteen && typeof canteen === 'object') {
        return canteen.id;
      }
      return canteen;
    })
    .filter((id): id is string => id !== null && id !== undefined && String(id).length > 0)
    .map((id) => String(id));
};

/**
 * A news without canteens is meant for every canteen. Otherwise it only matches the canteens it lists.
 */
export const doesNewsMatchCanteen = (news: NewsCanteenFields, canteenId: string | null | undefined): boolean => {
  const canteenIds = getNewsCanteenIds(news);
  if (canteenIds.length === 0) {
    return true;
  }
  if (canteenId === null || canteenId === undefined) {
    return false;
  }
  return canteenIds.includes(String(canteenId));
};
