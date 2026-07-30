import {CollectionNames} from 'repo-depkit-common';
import {MyDatabaseHelper} from '../helpers/MyDatabaseHelper';
import {MyDefineHook} from '../helpers/MyDefineHook';

const SCHEDULE_NAME = 'foodoffers-components-hook';

export default MyDefineHook.defineHookWithAllTablesExisting(SCHEDULE_NAME, async ({ filter }, apiContext) => {
  const myDatabaseHelper = new MyDatabaseHelper(apiContext);

  // When foodoffers are deleted, their component foodoffers must be deleted explicitly:
  // the junction rows are removed by the database via ON DELETE CASCADE, so the junction
  // delete filter below never fires for them and the component foodoffers would be orphaned.
  filter(CollectionNames.FOODOFFERS + '.items.delete', async (payloadModifiable) => {
    const foodofferIds = payloadModifiable as string[];
    if (foodofferIds && Array.isArray(foodofferIds) && foodofferIds.length > 0) {
      try {
        const componentsHelper = myDatabaseHelper.getFoodofferComponentsHelper();
        const junctionRows = await componentsHelper.readByQuery({
          filter: { parent_foodoffers_id: { _in: foodofferIds } },
          fields: ['component_foodoffers_id'],
          limit: -1,
        });

        const deletedIdsSet = new Set(foodofferIds);
        const componentFoodofferIds = junctionRows
          .map(row => (typeof row.component_foodoffers_id === 'string' ? row.component_foodoffers_id : null))
          .filter((id): id is string => !!id && !deletedIdsSet.has(id));

        if (componentFoodofferIds.length > 0) {
          const foodoffersHelper = myDatabaseHelper.getFoodoffersHelper();
          await foodoffersHelper.deleteMany(componentFoodofferIds);
        }
      } catch (err) {
        console.error(SCHEDULE_NAME + ': Error deleting component foodoffers on foodoffer delete:', err);
      }
    }

    return payloadModifiable;
  });

  filter(CollectionNames.FOODOFFER_COMPONENTS + '.items.delete', async (payloadModifiable) => {
    const junctionIds = payloadModifiable as number[];
    if (junctionIds && Array.isArray(junctionIds) && junctionIds.length > 0) {
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
