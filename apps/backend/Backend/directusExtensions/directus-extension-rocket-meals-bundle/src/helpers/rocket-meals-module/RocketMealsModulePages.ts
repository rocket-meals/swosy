/**
 * RocketMealsModulePages.ts – the pages of the `Rocket Meals` module in the Directus app.
 *
 * The module is the place for backend tools that do not fit Directus' generic content views:
 * today the food and app feedback chats, the other chats, the profiles (with push messages), the MCP instruction, the live pulse, the friendship network and the workflows, later e.g. housing management or top/flop lists of dishes.
 * A new page is one entry here plus a route in `src/rocket-meals-module/index.ts`; the side
 * navigation and the overview page are built from this list.
 */

import { BackendTranslationKeys } from '../translations/BackendTranslationKeys';

export type RocketMealsModulePage = {
  /** Path segment below the module, e.g. `food-feedbacks` → `/admin/rocket-meals/food-feedbacks`. */
  path: string;
  icon: string;
  labelKey: BackendTranslationKeys;
  descriptionKey: BackendTranslationKeys;
};

export class RocketMealsModulePages {
  /** Module id, also the URL segment: `/admin/rocket-meals`. */
  public static readonly MODULE_ID = 'rocket-meals';

  /** Product name, not translated. */
  public static readonly MODULE_NAME = 'Rocket Meals';

  public static readonly MODULE_ICON = 'rocket_launch';

  public static readonly FOOD_FEEDBACKS: RocketMealsModulePage = {
    path: 'food-feedbacks',
    icon: 'rate_review',
    labelKey: BackendTranslationKeys.rocket_meals_module_food_feedbacks,
    descriptionKey: BackendTranslationKeys.rocket_meals_module_food_feedbacks_description,
  };

  /** Feedbacks on the app (feedback form and store reviews), answered in a chat or in the store. */
  public static readonly APP_FEEDBACKS: RocketMealsModulePage = {
    path: 'app-feedbacks',
    icon: 'feedback',
    labelKey: BackendTranslationKeys.rocket_meals_module_app_feedbacks,
    descriptionKey: BackendTranslationKeys.rocket_meals_module_app_feedbacks_description,
  };

  /**
   * Profiles: search by nickname, and the details of one profile (`profiles/<id>`) with its devices,
   * feedbacks and chats. From there support starts a chat (`profiles/<id>/chat`) or sends a push
   * message to all devices of the profile (`profiles/<id>/push`). Every link to a profile in the
   * module leads here.
   */
  public static readonly PROFILES: RocketMealsModulePage = {
    path: 'profiles',
    icon: 'person_search',
    labelKey: BackendTranslationKeys.rocket_meals_module_profiles,
    descriptionKey: BackendTranslationKeys.rocket_meals_module_profiles_description,
  };

  /** Chats that belong to no food or app feedback, newest first – e.g. the ones support started from a profile. */
  public static readonly CHATS: RocketMealsModulePage = {
    path: 'chats',
    icon: 'forum',
    labelKey: BackendTranslationKeys.rocket_meals_module_chats,
    descriptionKey: BackendTranslationKeys.rocket_meals_module_chats_description,
  };

  /** Sub path of a profile: start a chat with it. */
  public static readonly PROFILE_CHAT_SEGMENT = 'chat';

  /** Sub path of a profile: send it a push message. */
  public static readonly PROFILE_PUSH_SEGMENT = 'push';

  /** Who is active in the app right now – meant to stay open on a second screen during the day. */
  public static readonly LIVE_PULSE: RocketMealsModulePage = {
    path: 'live-pulse',
    icon: 'monitor_heart',
    labelKey: BackendTranslationKeys.rocket_meals_module_live_pulse,
    descriptionKey: BackendTranslationKeys.rocket_meals_module_live_pulse_description,
  };

  /** All friendships as a network: who is connected to whom, with the friends of one profile on the side. */
  public static readonly FRIENDSHIP_NETWORK: RocketMealsModulePage = {
    path: 'friendship-network',
    icon: 'hub',
    labelKey: BackendTranslationKeys.rocket_meals_module_friendship_network,
    descriptionKey: BackendTranslationKeys.rocket_meals_module_friendship_network_description,
  };

  /** The instruction "connect an AI assistant via MCP" – the same one the app shows under `/public/mcp-instruction`. */
  public static readonly MCP_INSTRUCTION: RocketMealsModulePage = {
    path: 'mcp-instruction',
    icon: 'smart_toy',
    labelKey: BackendTranslationKeys.mcp_instruction,
    descriptionKey: BackendTranslationKeys.rocket_meals_module_mcp_instruction_description,
  };

  /** The background jobs (`workflows`): status, next run, start by hand, and the runs with their log. */
  public static readonly WORKFLOWS: RocketMealsModulePage = {
    path: 'workflows',
    icon: 'account_tree',
    labelKey: BackendTranslationKeys.rocket_meals_module_workflows,
    descriptionKey: BackendTranslationKeys.rocket_meals_module_workflows_description,
  };

  /** All pages, in the order of the navigation. */
  public static readonly PAGES: readonly RocketMealsModulePage[] = [RocketMealsModulePages.FOOD_FEEDBACKS, RocketMealsModulePages.APP_FEEDBACKS, RocketMealsModulePages.CHATS, RocketMealsModulePages.PROFILES, RocketMealsModulePages.MCP_INSTRUCTION, RocketMealsModulePages.LIVE_PULSE, RocketMealsModulePages.FRIENDSHIP_NETWORK, RocketMealsModulePages.WORKFLOWS];

  /**
   * The full URL of a page, e.g. for a link in a mail to support:
   * `<PUBLIC_URL>/admin/rocket-meals/app-feedbacks/abc`.
   */
  static getAdminUrl(publicUrl: string, page?: RocketMealsModulePage, ...segments: string[]): string {
    const baseUrl = publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl;
    return `${baseUrl}/admin${RocketMealsModulePages.getRoute(page, ...segments)}`;
  }

  /** The details page of a profile, `/rocket-meals/profiles/<id>` – the target of every profile link in the module. */
  static getProfileRoute(profileId: string): string {
    return RocketMealsModulePages.getRoute(RocketMealsModulePages.PROFILES, profileId);
  }

  /** `/rocket-meals/food-feedbacks/abc` – a path for the Vue router of the Directus app. */
  static getRoute(page?: RocketMealsModulePage, ...segments: string[]): string {
    const parts = [RocketMealsModulePages.MODULE_ID, ...(page ? [page.path] : []), ...segments.map(segment => encodeURIComponent(segment))];
    return `/${parts.join('/')}`;
  }
}
