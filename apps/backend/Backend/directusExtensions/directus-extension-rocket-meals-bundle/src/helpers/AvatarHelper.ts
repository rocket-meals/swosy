import { AccountHelper } from './AccountHelper';

export class AvatarHelper {
  /**
   * Deletes the avatar file for a userId
   * @param userId the userId
   * @returns {Promise<void>}
   */
  static async deleteAvatarOfUser(apiContext: any, userId: string) {
    const { services, database, schema, accountability } = apiContext;
    const filesService = await AvatarHelper.getAdminFileServiceInstance(apiContext);
    if (!userId) {
      throw new Error('deleteAvatarOfUser: No userId provided: ');
    }

    const existingUser = await database('directus_users').where({ id: userId }).first(); //get user
    if (!existingUser) {
      //handle no user found error
      throw new Error('deleteAvatarOfUser: No user found with id: ' + userId);
    }

    const avatar_filename = existingUser.avatar; //get filename of avatar
    if (avatar_filename) {
      //if has image
      await filesService.deleteOne(avatar_filename); //delete file
    }
  }

  /**
   * get a fileService with admin permission
   * @returns {*}
   */
  static async getAdminFileServiceInstance(apiContext: any) {
    // TODO: Replace with MyDatabaseHelper.getFilesHelper()

    const { schema, accountability, services } = apiContext;
    const { FilesService } = services;
    const adminAccountAbility = AccountHelper.getAdminAccountability(accountability);
    return new FilesService({ schema, accountability: adminAccountAbility });
  }
}
