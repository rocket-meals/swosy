/**
 * ProfileDetailsHelper.ts – data side of the profile pages in the module `Rocket Meals`:
 * the search (`profiles-page.vue`), the details of one profile (`profile-details-page.vue`) and the
 * avatar every page shows for a profile (`profile-avatar.vue`).
 *
 * Everything is read with the permissions of the person looking at the page. No Vue in here, so
 * the rules are testable in Node.
 */

import { CollectionNames } from 'repo-depkit-common/src/databaseTypes/CollectionNames';
import { PushNotificationHelper } from '../PushNotificationHelper';
import { BackendTranslationKeys } from '../translations/BackendTranslationKeys';
import { AppFeedbackChatHelper } from './AppFeedbackChatHelper';
import { FoodFeedbackChatHelper } from './FoodFeedbackChatHelper';
import { LivePulseHelper } from './LivePulseHelper';
import { RocketMealsModulePages } from './RocketMealsModulePages';

type DirectusFilter = Record<string, unknown>;

/** A profile as the module pages load it. */
export type ModuleProfile = {
  id: string;
  nickname?: string | null;
  avatar?: unknown;
  date_created?: string | null;
  date_updated?: string | null;
  language?: string | { code?: string | null } | null;
  canteen?: { id: string; alias?: string | null } | string | null;
  verified?: boolean | null;
  price_group?: string | null;
};

/** A device of a profile, with what the details page shows and the push token. */
export type ModuleProfileDevice = {
  id: string;
  alias?: string | null;
  platform?: string | null;
  brand?: string | null;
  system_version?: string | null;
  app_version?: string | null;
  is_ios?: boolean | null;
  is_android?: boolean | null;
  is_web?: boolean | null;
  is_simulator?: boolean | null;
  is_tablet?: boolean | null;
  pushTokenObj?: unknown;
  date_created?: string | null;
  date_updated?: string | null;
};

export type ModuleProfileQuery = Record<string, string | number>;

export class ProfileDetailsHelper {
  public static readonly SEARCH_PAGE_SIZE = 25;
  /** Food and app feedbacks shown on the details page, newest first. */
  public static readonly FEEDBACK_LIMIT = 10;
  public static readonly AVATAR_SIZE = 96;
  public static readonly LIST_AVATAR_SIZE = 40;

  /** Product names, not translated. */
  private static readonly PLATFORM_NAMES: Record<string, string> = { ios: 'iOS', android: 'Android', web: 'Web', macos: 'macOS', windows: 'Windows' };

  private static readonly UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  static readonly PROFILES_ENDPOINT = `/items/${CollectionNames.PROFILES}`;
  static readonly DEVICES_ENDPOINT = `/items/${CollectionNames.DEVICES}`;

  /** Fields of a profile in lists and as relation of chats and messages. */
  public static readonly LIST_FIELDS: readonly string[] = ['id', 'nickname', 'avatar', 'date_created', 'date_updated'];

  public static readonly DETAIL_FIELDS: readonly string[] = [...ProfileDetailsHelper.LIST_FIELDS, 'language', 'canteen.id', 'canteen.alias', 'verified', 'price_group'];

  public static readonly DEVICE_FIELDS: readonly string[] = ['id', 'alias', 'platform', 'brand', 'system_version', 'app_version', 'is_ios', 'is_android', 'is_web', 'is_simulator', 'is_tablet', 'pushTokenObj', 'date_created', 'date_updated'];

  /** The fields of a related profile, e.g. `profile.id`, `profile.nickname`, … */
  static relatedFields(relation: string, fields: readonly string[] = ProfileDetailsHelper.LIST_FIELDS): string[] {
    return fields.map(field => `${relation}.${field}`);
  }

  /** The details page of a profile, `undefined` without id. */
  static getRoute(profile: { id?: string | null } | string | null | undefined): string | undefined {
    const id = typeof profile === 'string' ? profile : profile?.id;
    return id ? RocketMealsModulePages.getProfileRoute(id) : undefined;
  }

  static getChatRoute(profileId: string): string {
    return RocketMealsModulePages.getRoute(RocketMealsModulePages.PROFILES, profileId, RocketMealsModulePages.PROFILE_CHAT_SEGMENT);
  }

  static getPushRoute(profileId: string): string {
    return RocketMealsModulePages.getRoute(RocketMealsModulePages.PROFILES, profileId, RocketMealsModulePages.PROFILE_PUSH_SEGMENT);
  }

  /** The item page of the profile in the content module, for everything the module does not show. */
  static getContentRoute(profileId: string): string {
    return `/content/${CollectionNames.PROFILES}/${encodeURIComponent(profileId)}`;
  }

  /** The profile of a relation, `undefined` when only the id is loaded or nothing is set. */
  static getProfile(profile: ModuleProfile | string | null | undefined): ModuleProfile | undefined {
    return profile && typeof profile === 'object' ? profile : undefined;
  }

  /** The id of a relation that may be loaded or only an id. */
  static getProfileId(profile: { id?: string | null } | string | null | undefined): string | undefined {
    if (!profile) {
      return undefined;
    }
    return typeof profile === 'string' ? profile : profile.id || undefined;
  }

  /**
   * Profiles whose nickname contains the search, or whose id is the search – support often gets an
   * id from a mail or a log. Most recently active first.
   */
  static buildSearchFilter(search?: string | null): DirectusFilter | undefined {
    const text = search?.trim();
    if (!text) {
      return undefined;
    }
    const byNickname = { nickname: { _icontains: text } };
    // Only a complete UUID is compared with the id: the database rejects anything else for a UUID column.
    return ProfileDetailsHelper.UUID_PATTERN.test(text) ? { _or: [byNickname, { id: { _eq: text } }] } : byNickname;
  }

  static buildSearchQuery(search: string | null | undefined, page: number): ModuleProfileQuery {
    const query: ModuleProfileQuery = {
      fields: ProfileDetailsHelper.LIST_FIELDS.join(','),
      sort: '-date_updated',
      limit: ProfileDetailsHelper.SEARCH_PAGE_SIZE,
      page: Math.max(1, page),
      meta: 'filter_count',
    };
    const filter = ProfileDetailsHelper.buildSearchFilter(search);
    if (filter) {
      query.filter = JSON.stringify(filter);
    }
    return query;
  }

  static getPageCount(total: number): number {
    return Math.max(1, Math.ceil(total / ProfileDetailsHelper.SEARCH_PAGE_SIZE));
  }

  static buildProfileQuery(): ModuleProfileQuery {
    return { fields: ProfileDetailsHelper.DETAIL_FIELDS.join(',') };
  }

  static buildDevicesQuery(profileId: string): ModuleProfileQuery {
    return {
      fields: ProfileDetailsHelper.DEVICE_FIELDS.join(','),
      filter: JSON.stringify({ profile: { _eq: profileId } }),
      sort: '-date_updated',
      limit: -1,
    };
  }

  /** The newest food feedbacks of the profile with a rating or a comment, with the fields of the feedback list. */
  static buildFoodFeedbacksQuery(profileId: string): ModuleProfileQuery {
    return {
      fields: FoodFeedbackChatHelper.LIST_FIELDS.join(','),
      filter: JSON.stringify({ _and: [{ profile: { _eq: profileId } }, { _or: [{ rating: { _nnull: true } }, { comment: { _nempty: true } }] }] }),
      sort: '-date_updated',
      limit: ProfileDetailsHelper.FEEDBACK_LIMIT,
    };
  }

  static buildAppFeedbacksQuery(profileId: string): ModuleProfileQuery {
    return {
      fields: AppFeedbackChatHelper.LIST_FIELDS.join(','),
      filter: JSON.stringify({ profile: { _eq: profileId } }),
      sort: '-date_created',
      limit: ProfileDetailsHelper.FEEDBACK_LIMIT,
    };
  }

  static getNickname(profile: ModuleProfile | string | null | undefined): string | undefined {
    return ProfileDetailsHelper.getProfile(profile)?.nickname?.trim() || undefined;
  }

  static getInitials(profile: ModuleProfile | string | null | undefined): string {
    return LivePulseHelper.getInitials(ProfileDetailsHelper.getNickname(profile));
  }

  /** The avatar drawn by `profile-avatar-endpoint`, `undefined` without avatar (the page shows initials). */
  static getAvatarUrl(profile: ModuleProfile | string | null | undefined, size: number, apiRoot: string = '/'): string | undefined {
    return LivePulseHelper.getAvatarUrl(ProfileDetailsHelper.getProfile(profile), size, apiRoot);
  }

  /** The language code stored in the profile (`de-DE` or `{ code }`). */
  static getLanguageCode(profile: ModuleProfile | null | undefined): string | undefined {
    const language = profile?.language;
    if (!language) {
      return undefined;
    }
    return typeof language === 'string' ? language : language.code || undefined;
  }

  static getCanteenName(profile: ModuleProfile | null | undefined): string | undefined {
    const canteen = profile?.canteen;
    if (!canteen) {
      return undefined;
    }
    return typeof canteen === 'string' ? canteen : canteen.alias || canteen.id;
  }

  /** The Expo push token of a device, `undefined` when it has none (no permission, logged out, web). */
  static getPushToken(device: ModuleProfileDevice): string | undefined {
    return PushNotificationHelper.readExpoPushToken(device.pushTokenObj);
  }

  /** The distinct push tokens of the devices – several devices can share one after a reinstall. */
  static getPushTokens(devices: readonly ModuleProfileDevice[]): string[] {
    const tokens = devices.map(device => ProfileDetailsHelper.getPushToken(device)).filter((token): token is string => !!token);
    return [...new Set(tokens)];
  }

  static getDeviceIcon(device: ModuleProfileDevice): string {
    if (device.is_web) {
      return 'language';
    }
    if (device.is_tablet) {
      return 'tablet';
    }
    if (device.is_ios) {
      return 'phone_iphone';
    }
    if (device.is_android) {
      return 'phone_android';
    }
    return 'devices';
  }

  /** How a platform is written, `ios` → `iOS`; unknown ones stay as they are. */
  static getPlatformName(platform: string | null | undefined): string | undefined {
    const value = platform?.trim();
    if (!value) {
      return undefined;
    }
    return ProfileDetailsHelper.PLATFORM_NAMES[value.toLowerCase()] ?? value;
  }

  /** E.g. `Apple · iOS 18.2` – brand, platform and system version, whatever is known. */
  static getDeviceDescription(device: ModuleProfileDevice): string | undefined {
    const system = [ProfileDetailsHelper.getPlatformName(device.platform), device.system_version].filter(part => !!part && String(part).trim().length > 0).join(' ');
    const parts = [device.alias, device.brand, system].filter((part): part is string => !!part && part.trim().length > 0);
    return parts.length > 0 ? parts.join(' · ') : undefined;
  }

  static getPushTokenLabelKey(device: ModuleProfileDevice): BackendTranslationKeys {
    return ProfileDetailsHelper.getPushToken(device) ? BackendTranslationKeys.rocket_meals_module_profile_push_enabled : BackendTranslationKeys.rocket_meals_module_profile_push_disabled;
  }
}
