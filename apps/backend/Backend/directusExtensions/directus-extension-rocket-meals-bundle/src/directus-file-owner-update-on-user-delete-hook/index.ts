import { defineHook } from '@directus/extensions-sdk';
import { FileServiceCreator } from '../helpers/ItemsServiceCreator';
import { EventHelper } from '../helpers/EventHelper';
import { Filter } from '@directus/types';
import { CollectionNames, DatabaseTypes } from 'repo-depkit-common';
import { DeletePermissionHelper } from '../helpers/DeletePermissionHelper';

export default defineHook(async ({ action, filter }, apiContext) => {
  const fileServiceCreator = new FileServiceCreator(apiContext);
  const filesService = await fileServiceCreator.getFileService();

  filter(EventHelper.USERS_DELETE_EVENT, async (input, meta, context) => {
    const usersToDeleteIds: string[] = input as string[]; // [ 'e939cb0c-0ca5-42fd-ac8c-1ffaeae7f22b' ]

    // Since Directus 11.13 this filter runs before the permission check - only reassign files if the delete is allowed
    if (!(await DeletePermissionHelper.canDeleteAll(apiContext, context, CollectionNames.USERS, usersToDeleteIds))) {
      return input;
    }

    const userWhoDeletes = context.accountability?.user;

    const orLogicalsUploadedBy: Filter[] = [];
    const orLogicalsModifiedBy: Filter[] = [];

    for (let userToDeleteId of usersToDeleteIds) {
      orLogicalsUploadedBy.push({
        uploaded_by: {
          _eq: userToDeleteId,
        },
      });
      orLogicalsModifiedBy.push({
        modified_by: {
          _eq: userToDeleteId,
        },
      });
    }

    const queryUploadedBy = {
      filter: {
        _or: orLogicalsUploadedBy,
      },
    };
    const queryModifiedBy = {
      filter: {
        _or: orLogicalsModifiedBy,
      },
    };

    const partialDirectusFileUploadedBy: Partial<DatabaseTypes.DirectusFiles> = {
      uploaded_by: userWhoDeletes,
    };
    const partialDirectusFileModifiedBy: Partial<DatabaseTypes.DirectusFiles> = {
      modified_by: userWhoDeletes,
    };

    await filesService.updateByQuery(queryUploadedBy, partialDirectusFileUploadedBy);

    await filesService.updateByQuery(queryModifiedBy, partialDirectusFileModifiedBy);

    return input;
  });
});
