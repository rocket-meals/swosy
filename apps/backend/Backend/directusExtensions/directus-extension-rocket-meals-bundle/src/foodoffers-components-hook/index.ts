import {CollectionNames} from 'repo-depkit-common';
import {MyDatabaseHelper} from '../helpers/MyDatabaseHelper';
import {MyDefineHook} from '../helpers/MyDefineHook';
import {DeletePermissionHelper} from '../helpers/DeletePermissionHelper';
import {FoodofferComponentsCleanupHelper} from './FoodofferComponentsCleanupHelper';

const SCHEDULE_NAME = 'foodoffers-components-hook';

export default MyDefineHook.defineHookWithAllTablesExisting(SCHEDULE_NAME, ({ filter, schedule }, apiContext) => {
  const myDatabaseHelper = new MyDatabaseHelper(apiContext);

  // Deleting a parent foodoffer removes its junction rows via the database ON DELETE CASCADE, which runs no Directus hook.
  // So the component foodoffers have to be deleted here, while the junction rows still exist.
  filter(CollectionNames.FOODOFFERS + '.items.delete', async (payloadModifiable, _meta, eventContext) => {
    const foodofferIds = payloadModifiable as (string | number)[];
    // Since Directus 11.13 this filter runs before the permission check - only delete the component foodoffers if the delete is allowed
    if (foodofferIds && Array.isArray(foodofferIds) && foodofferIds.length > 0 && (await DeletePermissionHelper.canDeleteAll(apiContext, eventContext, CollectionNames.FOODOFFERS, foodofferIds))) {
      try {
        const componentFoodofferIds = await FoodofferComponentsCleanupHelper.getComponentFoodofferIdsOfParents(myDatabaseHelper, foodofferIds);
        if (componentFoodofferIds.length > 0) {
          await myDatabaseHelper.getFoodoffersHelper().deleteMany(componentFoodofferIds);
        }
      } catch (err) {
        console.error(SCHEDULE_NAME + ': Error deleting component foodoffers on foodoffer delete:', err);
      }
    }

    return payloadModifiable;
  });

  filter(CollectionNames.FOODOFFER_COMPONENTS + '.items.delete', async (payloadModifiable, _meta, eventContext) => {
    const junctionIds = payloadModifiable as number[];
    // Since Directus 11.13 this filter runs before the permission check - only delete the component foodoffers if the delete is allowed
    if (junctionIds && Array.isArray(junctionIds) && junctionIds.length > 0 && (await DeletePermissionHelper.canDeleteAll(apiContext, eventContext, CollectionNames.FOODOFFER_COMPONENTS, junctionIds))) {
      try {
        const componentsHelper = myDatabaseHelper.getFoodofferComponentsHelper();
        const junctionRows = await componentsHelper.readByQuery({
          filter: { id: { _in: junctionIds } },
          fields: ['component_foodoffers_id'],
          limit: -1,
        });

        const componentFoodofferIds = junctionRows
          .map(row => (typeof row.component_foodoffers_id === 'string' ? row.component_foodoffers_id : null))
          .filter((id): id is string => !!id);

        if (componentFoodofferIds.length > 0) {
          const foodoffersHelper = myDatabaseHelper.getFoodoffersHelper();
          await foodoffersHelper.deleteMany(componentFoodofferIds);
        }
      } catch (err) {
        console.error(SCHEDULE_NAME + ': Error deleting component foodoffers on junction delete:', err);
      }
    }

    return payloadModifiable;
  });

  // Cleans up component foodoffers that were orphaned before the filter above existed (or by a delete that bypassed Directus).
  schedule('23 * * * *', async () => {
    try {
      const deleted = await FoodofferComponentsCleanupHelper.deleteOrphanedComponentFoodoffers(myDatabaseHelper, message => apiContext.logger.info(SCHEDULE_NAME + ': ' + message));
      if (deleted > 0) {
        apiContext.logger.info(SCHEDULE_NAME + ': orphaned component foodoffers cleanup finished, deleted ' + deleted);
      }
    } catch (err) {
      apiContext.logger.error(SCHEDULE_NAME + ': Error during orphaned component foodoffers cleanup: ' + (err instanceof Error ? err.message : String(err)));
    }
  });
});
