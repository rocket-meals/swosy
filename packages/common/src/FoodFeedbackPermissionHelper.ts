import { AppSettings } from './databaseTypes/types';

/**
 * Werte von `app_settings.foods_feedbacks_comments_type` (und `..._for_unverified`).
 * `write` = nur eigenen Kommentar schreiben, `read` = nur fremde Kommentare lesen.
 */
export const FoodsFeedbacksCommentsTypes = {
  disabled: 'disabled',
  write: 'write',
  read: 'read',
  readAndWrite: 'readAndWrite',
} as const;
export type FoodsFeedbacksCommentsType = (typeof FoodsFeedbacksCommentsTypes)[keyof typeof FoodsFeedbacksCommentsTypes];

/**
 * Wert der `*_for_unverified`-Einstellungen: nicht verifizierte Profile bekommen dieselbe
 * Einstellung wie verifizierte.
 */
export const FOOD_FEEDBACK_SETTING_INHERIT = 'inherit';

/** Wert von `app_settings.foods_ratings_type` (und `..._for_unverified`), der Bewertungen ausschaltet. */
export const FOODS_RATINGS_TYPE_DISABLED = 'disabled';

export type FoodFeedbackPermissions = {
  /** What the current user may do. */
  canRate: boolean;
  commentsType: FoodsFeedbacksCommentsType;
  canWriteComments: boolean;
  canReadComments: boolean;
  /** Whether the rating UI is shown at all – only `foods_ratings_type = disabled` hides it. */
  showRating: boolean;
  /** Rating is shown, but unverified profiles (guests) may not use it: they need a verified account. */
  ratingRequiresVerifiedAccount: boolean;
  /** Whether the comment input is shown at all – decided by `foods_feedbacks_comments_type`. */
  showCommentInput: boolean;
  /** The comment input is shown, but unverified profiles (guests) may not write: they need a verified account. */
  writingCommentsRequiresVerifiedAccount: boolean;
};

type FoodFeedbackAppSettings = Pick<AppSettings, 'foods_feedbacks_comments_type' | 'foods_feedbacks_comments_type_for_unverified' | 'foods_ratings_type' | 'foods_ratings_type_for_unverified'>;

/**
 * Was ein Nutzer bei Speisen-Rückmeldungen darf.
 *
 * - `foods_ratings_type`: `disabled` schaltet Bewertungen (Sterne, Quick-Action auf der Karte) für alle aus.
 * - `foods_feedbacks_comments_type`: Kommentar-Typ.
 *
 * Für nicht verifizierte Profile (`profiles.verified === false`, z. B. Gäste ohne eigene E-Mail-Adresse)
 * gelten zusätzlich `foods_ratings_type_for_unverified` und `foods_feedbacks_comments_type_for_unverified`.
 * `inherit` (`FOOD_FEEDBACK_SETTING_INHERIT`) oder leer (`null`) = dieselbe Einstellung wie für verifizierte
 * Profile; `disabled` schaltet für sie aus, auch wenn verifizierte Profile dürfen. Dann bleibt die
 * Funktion sichtbar, ist für sie aber gesperrt (wie für anonyme Nutzer, mit dem Hinweis, dass ein
 * Gast-Account nicht reicht) – siehe `ratingRequiresVerifiedAccount` / `writingCommentsRequiresVerifiedAccount`.
 *
 * Wird im Frontend (was angezeigt wird) und im Backend (was gespeichert werden darf) genutzt.
 */
export class FoodFeedbackPermissionHelper {
  static readonly DEFAULT_COMMENTS_TYPE: FoodsFeedbacksCommentsType = FoodsFeedbacksCommentsTypes.disabled;

  static parseCommentsType(value: string | null | undefined): FoodsFeedbacksCommentsType | null {
    const knownTypes: string[] = Object.values(FoodsFeedbacksCommentsTypes);
    if (value && knownTypes.includes(value)) {
      return value as FoodsFeedbacksCommentsType;
    }
    return null;
  }

  static getCommentsType(appSettings: FoodFeedbackAppSettings | null | undefined, isUnverified: boolean): FoodsFeedbacksCommentsType {
    const verifiedType = FoodFeedbackPermissionHelper.parseCommentsType(appSettings?.foods_feedbacks_comments_type) ?? FoodFeedbackPermissionHelper.DEFAULT_COMMENTS_TYPE;
    if (!isUnverified) {
      return verifiedType;
    }
    // `inherit`, empty and unknown values all follow the type of verified profiles.
    return FoodFeedbackPermissionHelper.parseCommentsType(appSettings?.foods_feedbacks_comments_type_for_unverified) ?? verifiedType;
  }

  static canRate(appSettings: FoodFeedbackAppSettings | null | undefined, isUnverified: boolean): boolean {
    const verifiedCanRate = appSettings?.foods_ratings_type !== FOODS_RATINGS_TYPE_DISABLED;
    if (!isUnverified) {
      return verifiedCanRate;
    }
    // `inherit`, empty and unknown values all follow verified profiles.
    return appSettings?.foods_ratings_type_for_unverified !== FOODS_RATINGS_TYPE_DISABLED && verifiedCanRate;
  }

  static canWriteComments(commentsType: FoodsFeedbacksCommentsType): boolean {
    return commentsType === FoodsFeedbacksCommentsTypes.write || commentsType === FoodsFeedbacksCommentsTypes.readAndWrite;
  }

  static canReadComments(commentsType: FoodsFeedbacksCommentsType): boolean {
    return commentsType === FoodsFeedbacksCommentsTypes.read || commentsType === FoodsFeedbacksCommentsTypes.readAndWrite;
  }

  static getPermissions(appSettings: FoodFeedbackAppSettings | null | undefined, isUnverified: boolean): FoodFeedbackPermissions {
    const commentsType = FoodFeedbackPermissionHelper.getCommentsType(appSettings, isUnverified);
    const verifiedCanRate = FoodFeedbackPermissionHelper.canRate(appSettings, false);
    const unverifiedCanRate = FoodFeedbackPermissionHelper.canRate(appSettings, true);
    const verifiedCanWriteComments = FoodFeedbackPermissionHelper.canWriteComments(FoodFeedbackPermissionHelper.getCommentsType(appSettings, false));
    const unverifiedCanWriteComments = FoodFeedbackPermissionHelper.canWriteComments(FoodFeedbackPermissionHelper.getCommentsType(appSettings, true));
    return {
      canRate: isUnverified ? unverifiedCanRate : verifiedCanRate,
      commentsType,
      canWriteComments: FoodFeedbackPermissionHelper.canWriteComments(commentsType),
      canReadComments: FoodFeedbackPermissionHelper.canReadComments(commentsType),
      showRating: verifiedCanRate,
      ratingRequiresVerifiedAccount: verifiedCanRate && !unverifiedCanRate,
      showCommentInput: verifiedCanWriteComments,
      writingCommentsRequiresVerifiedAccount: verifiedCanWriteComments && !unverifiedCanWriteComments,
    };
  }
}
