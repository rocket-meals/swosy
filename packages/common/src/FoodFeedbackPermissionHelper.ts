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
 * Zusätzlicher Wert nur für `foods_feedbacks_comments_type_for_unverified`: nicht verifizierte Profile
 * bekommen denselben Kommentar-Typ wie verifizierte (`foods_feedbacks_comments_type`).
 */
export const FOODS_FEEDBACKS_COMMENTS_TYPE_INHERIT = 'inherit';

export type FoodFeedbackPermissions = {
  canRate: boolean;
  commentsType: FoodsFeedbacksCommentsType;
  canWriteComments: boolean;
  canReadComments: boolean;
};

type FoodFeedbackAppSettings = Pick<AppSettings, 'foods_feedbacks_comments_type' | 'foods_feedbacks_comments_type_for_unverified' | 'foods_ratings_enabled_for_unverified'>;

/**
 * Was ein Nutzer bei Speisen-Rückmeldungen darf. Für nicht verifizierte Profile
 * (`profiles.verified === false`, z. B. Gäste ohne eigene E-Mail-Adresse) gelten eigene Einstellungen:
 *
 * - `foods_ratings_enabled_for_unverified`: Dürfen nicht verifizierte Profile bewerten? Leer (`null`) = ja.
 * - `foods_feedbacks_comments_type_for_unverified`: Kommentar-Typ für nicht verifizierte Profile.
 *   `inherit` (`FOODS_FEEDBACKS_COMMENTS_TYPE_INHERIT`) oder leer (`null`) = derselbe Typ wie
 *   `foods_feedbacks_comments_type`.
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
    if (!isUnverified) {
      return true;
    }
    return appSettings?.foods_ratings_enabled_for_unverified !== false;
  }

  static canWriteComments(commentsType: FoodsFeedbacksCommentsType): boolean {
    return commentsType === FoodsFeedbacksCommentsTypes.write || commentsType === FoodsFeedbacksCommentsTypes.readAndWrite;
  }

  static canReadComments(commentsType: FoodsFeedbacksCommentsType): boolean {
    return commentsType === FoodsFeedbacksCommentsTypes.read || commentsType === FoodsFeedbacksCommentsTypes.readAndWrite;
  }

  static getPermissions(appSettings: FoodFeedbackAppSettings | null | undefined, isUnverified: boolean): FoodFeedbackPermissions {
    const commentsType = FoodFeedbackPermissionHelper.getCommentsType(appSettings, isUnverified);
    return {
      canRate: FoodFeedbackPermissionHelper.canRate(appSettings, isUnverified),
      commentsType,
      canWriteComments: FoodFeedbackPermissionHelper.canWriteComments(commentsType),
      canReadComments: FoodFeedbackPermissionHelper.canReadComments(commentsType),
    };
  }
}
