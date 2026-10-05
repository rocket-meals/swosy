import {MyDatabaseHelper} from './MyDatabaseHelper';
import {FilesServiceHelper} from './FilesServiceHelper';

export class AvatarHelper {
  /**
   * Deletes the avatar file for a userId
   * @param userId the userId
   * @returns {Promise<void>}
   */
  static async deleteAvatarOfUser(myDatabaseHelper: MyDatabaseHelper, userId: string) {
    const database = myDatabaseHelper?.eventContext?.database || myDatabaseHelper?.apiContext.database;

    // As admin: the caller may delete the user (checked by the users.delete hook), but app users have no delete permission on directus_files
    const filesService = new FilesServiceHelper(myDatabaseHelper, true);
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
}
