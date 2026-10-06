import { Accountability } from '@directus/types';

/**
 * Helper for Account things
 */
export class AccountabilityHelper {
  public static getAccountabilityFromRequest(req: any): Accountability | undefined {
    const accountability = req?.accountability;
    if (accountability) {
      return accountability as Accountability;
    } else {
      return undefined;
    }
  }

  public static isAdminAccountability(accountability?: Accountability | null): boolean {
    if (!accountability) {
      return false;
    }

    if (accountability.admin === true) {
      return true;
    }

    return (accountability as { adminAccess?: boolean }).adminAccess === true;
  }

  /**
   * Whether the request comes from someone who may use the Directus app (the backend UI) – admins,
   * but also e.g. canteen staff with a role that has app access. App users of Rocket Meals only
   * use the API and never have app access, so this tells backend users from app users.
   */
  public static isAppAccessAccountability(accountability?: Accountability | null): boolean {
    if (!accountability) {
      return false;
    }
    return AccountabilityHelper.isAdminAccountability(accountability) || accountability.app === true;
  }
}
