import { AccountHelper } from './AccountHelper';
import { ApiContext } from './ApiContext';
import { MyEventContext } from './MyDatabaseHelper';

export class AvatarHelper {
  /**
   * Deletes the avatar file for a userId
   * @param userId the userId
   * @returns {Promise<void>}
   */
  static async deleteAvatarOfUser(apiContext: ApiContext, eventContext: MyEventContext | undefined, userId: string) {
    const database = eventContext?.database || apiContext.database;
    const filesService = await AvatarHelper.getAdminFileServiceInstance(apiContext, eventContext);
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
  static async getAdminFileServiceInstance(apiContext: ApiContext, eventContext?: MyEventContext) {
    // TODO: Replace with MyDatabaseHelper.getFilesHelper()

    const { services } = apiContext;
    const { FilesService } = services;
    const schema = eventContext?.schema || (await apiContext.getSchema());
    const accountability = eventContext?.accountability || apiContext.accountability;
    const adminAccountAbility = AccountHelper.getAdminAccountability(accountability);
    return new FilesService({ schema, accountability: adminAccountAbility });
  }
}
