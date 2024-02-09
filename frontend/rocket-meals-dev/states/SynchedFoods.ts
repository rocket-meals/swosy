import {PersistentStore} from "@/helper/sync_state_helper/PersistentStore";
import {Canteens, CanteensBusinesshours, Foods} from "@/helper/database_helper/databaseTypes/types";
import {useSynchedResourceRaw} from "@/states/SynchedResource";
import {useIsDemo} from "@/states/SynchedDemo";

export function useSynchedFoods(): [(Record<string, Foods> | undefined), ((newValue: Record<string, Foods>, timestampe?: number) => void), (number | undefined)] {
  const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourceRaw<Foods>(PersistentStore.foods);
  const demo = useIsDemo()
  let lastUpdate = resourcesRaw?.lastUpdate;
  let usedResources = resourcesOnly;
  if(demo) {
    usedResources = getDemoResources()
  }
  return [usedResources, setResourcesOnly, lastUpdate]
}

function getDemoResources(): Record<string, Foods> {

  let demoNames = ["Fries", "Burger", "Lasagne", "Pizza", "Pasta", "Salad", "Soup", "Sushi", "Steak", "Chicken", "Fish", "Rice", "Noodles", "Dumplings", "Curry", "Tacos", "Burritos", "Sandwich", "Hotdog", "Kebab", "Doner", "Falafel", "Shawarma"]
  let demoeResources: Record<string, Foods> = {}
    demoNames.forEach((name, index) => {
      let demoResource: Foods = getDemoResource(index.toString(), "Demo "+name)
        demoeResources[demoResource.id] = demoResource
    })

  return demoeResources
}

function getDemoResource(id: string, name: string): Foods{
  return(
      {
        date_created: new Date().toISOString(),
        date_updated: new Date().toISOString(),
        id: id,
        alias: name,
        image: undefined,
        sort: undefined,
        status: "",
        user_created: undefined,
        user_updated: undefined,
        canteen: undefined,
        price: undefined,
        food_category: undefined,
        food_category_id: undefined
      }
  )
}