import { AppSettings } from './databaseTypes/types';

/**
 * Werte von `app_settings.foods_feedbacks_comments_type` (und `..._guests`).
 * `write` = nur eigenen Kommentar schreiben, `read` = nur fremde Kommentare lesen.
 */
export const FoodsFeedbacksCommentsTypes = {
  disabled: 'disabled',
  write: 'write',
  read: 'read',
  readAndWrite: 'readAndWrite',
} as const;
export type FoodsFeedbacksCommentsType = (typeof FoodsFeedbacksCommentsTypes)[keyof typeof FoodsFeedbacksCommentsTypes];

export type FoodFeedbackPermissions = {
  canRate: boolean;
  commentsType: FoodsFeedbacksCommentsType;
  canWriteComments: boolean;
  canReadComments: boolean;
};

type FoodFeedbackAppSettings = Pick<AppSettings, 'foods_feedbacks_comments_type' | 'foods_feedbacks_comments_type_guests' | 'foods_ratings_guests_enabled'>;

/**
 * Was ein Nutzer bei Speisen-Rückmeldungen darf – für Gäste (siehe `GuestAccountHelper`) gelten
 * eigene Einstellungen, weil ihre Identität nicht über eine E-Mail-Adresse bestätigt ist.
 *
 * - `foods_ratings_guests_enabled`: Dürfen Gäste bewerten? Leer (`null`) = ja, wie bisher.
 * - `foods_feedbacks_comments_type_guests`: Kommentar-Typ für Gäste. Leer (`null`) = derselbe Typ
 *   wie `foods_feedbacks_comments_type` für registrierte Nutzer.
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

  static getCommentsType(appSettings: FoodFeedbackAppSettings | null | undefined, isGuest: boolean): FoodsFeedbacksCommentsType {
    const registeredType = FoodFeedbackPermissionHelper.parseCommentsType(appSettings?.foods_feedbacks_comments_type) ?? FoodFeedbackPermissionHelper.DEFAULT_COMMENTS_TYPE;
    if (!isGuest) {
      return registeredType;
    }
    return FoodFeedbackPermissionHelper.parseCommentsType(appSettings?.foods_feedbacks_comments_type_guests) ?? registeredType;
  }

  static canRate(appSettings: FoodFeedbackAppSettings | null | undefined, isGuest: boolean): boolean {
    if (!isGuest) {
      return true;
    }
    return appSettings?.foods_ratings_guests_enabled !== false;
  }

  static canWriteComments(commentsType: FoodsFeedbacksCommentsType): boolean {
    return commentsType === FoodsFeedbacksCommentsTypes.write || commentsType === FoodsFeedbacksCommentsTypes.readAndWrite;
  }

  static canReadComments(commentsType: FoodsFeedbacksCommentsType): boolean {
    return commentsType === FoodsFeedbacksCommentsTypes.read || commentsType === FoodsFeedbacksCommentsTypes.readAndWrite;
  }

  static getPermissions(appSettings: FoodFeedbackAppSettings | null | undefined, isGuest: boolean): FoodFeedbackPermissions {
    const commentsType = FoodFeedbackPermissionHelper.getCommentsType(appSettings, isGuest);
    return {
      canRate: FoodFeedbackPermissionHelper.canRate(appSettings, isGuest),
      commentsType,
      canWriteComments: FoodFeedbackPermissionHelper.canWriteComments(commentsType),
      canReadComments: FoodFeedbackPermissionHelper.canReadComments(commentsType),
    };
  }
}
