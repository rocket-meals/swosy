import {CollectionNames} from 'repo-depkit-common';
import {MyDatabaseHelper} from '../helpers/MyDatabaseHelper';
import {MyDefineHook} from '../helpers/MyDefineHook';
import {DeletePermissionHelper} from '../helpers/DeletePermissionHelper';

const SCHEDULE_NAME = 'foodoffers-components-hook';

export default MyDefineHook.defineHookWithAllTablesExisting(SCHEDULE_NAME, async ({ filter }, apiContext) => {
  const myDatabaseHelper = new MyDatabaseHelper(apiContext);

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
});
