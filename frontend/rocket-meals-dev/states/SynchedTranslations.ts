import {PersistentStore} from "@/helper/syncState/PersistentStore";
import {AppTranslations, Canteens, CanteensBusinesshours, Markings} from "@/helper/database/databaseTypes/types";
import {useSynchedResourceRaw} from "@/states/SynchedResource";
import {useIsDemo} from "@/states/SynchedDemo";
import {CollectionHelper} from "@/helper/database/server/CollectionHelper";
import {getDemoUtilizationGroup} from "@/states/SynchedUtiliztations";

async function loadTranslationsFromServer(): Promise<AppTranslations[]> {
  let collectionHelper = new CollectionHelper<AppTranslations>("app_translations");

  const fields = ['*', "translations.*"];

  let query = {
    limit: -1,
    fields: fields
  }

  return await collectionHelper.readItems(query);
}

export function useSynchedAppTranslationsDict(): [(Record<string, AppTranslations> | undefined), ((newValue: Record<string, AppTranslations>, timestampe?: number) => void), (number | undefined), ((nowInMs?: number) => Promise<void>)
] {
  const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourceRaw<AppTranslations>(PersistentStore.app_translations);
  let lastUpdate = resourcesRaw?.lastUpdate;
  let usedResources = resourcesOnly;

  async function updateFromServer(nowInMs?: number) {
    let resourceList = await loadTranslationsFromServer()
    let resourceDict = CollectionHelper.convertListToDict(resourceList, "id")
    setResourcesOnly(resourceDict, nowInMs);
  }

  return [usedResources, setResourcesOnly, lastUpdate, updateFromServer]
}