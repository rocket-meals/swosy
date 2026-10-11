/**
 * ModuleItemTypes.ts – the shapes every page of the module `Rocket Meals` shares when it loads
 * Directus items: the system fields of an item, the short form of a profile, an item with a
 * picture and the chip a status is shown with. The page specific types build on these, so a
 * field is declared once and not again on every page.
 *
 * Types only, no Vue or Directus app imports.
 */

import type { BackendTranslationKeys } from '../translations/BackendTranslationKeys';

/** A Directus item with when it was created. */
export type ModuleCreatedItem = {
  id: string;
  date_created?: string | null;
};

/** A Directus item with when it was created and last changed. */
export type ModuleItem = ModuleCreatedItem & {
  date_updated?: string | null;
};

/** An item with its name in the backend, e.g. a canteen or a food. */
export type ModuleAliasItem = {
  id: string;
  alias?: string | null;
};

/** A relation to a canteen: loaded with its name, only its id, or not set. */
export type ModuleCanteenRelation = ModuleAliasItem | string | null;

/** Something with a picture: a Directus file or else a remote URL (foods, canteens). */
export type ModuleItemWithImage = {
  image?: string | { id: string } | null;
  image_remote_url?: string | null;
};

/** An item with its name and its picture, e.g. a food in the ticker or a canteen of the canteen filter. */
export type ModuleImageItem = ModuleAliasItem & ModuleItemWithImage;

/** What every page shows of a profile: the nickname with the avatar. */
export type ModuleProfileSummary = {
  id: string;
  nickname?: string | null;
  avatar?: unknown;
};

/** The support chat of a feedback or wish: loaded with its state, only its id, or not set. */
export type ModuleChatRelation = { id: string; conversation_state?: string | null; date_updated?: string | null } | string | null;

/** How a status is shown as chip: label, icon and colour. */
export type ModuleStatusPresentation = {
  labelKey: BackendTranslationKeys;
  icon: string;
  /** A Directus theme colour variable, so the chip works in light and dark mode. */
  color: string;
};
