import {PersistentStore} from "@/helper/syncState/PersistentStore";
import {Languages} from "@/helper/database/databaseTypes/types";
import {useSynchedResourceRaw} from "@/states/SynchedResource";
import {useIsDemo} from "@/states/SynchedDemo";
import {CollectionHelper} from "@/helper/database/server/CollectionHelper";

export async function loadLanguageRemoteDict() {
  const collectionHelper = new CollectionHelper<Languages>("languages")
  let languagesList = await collectionHelper.readItems();
  let languagesListDict = collectionHelper.convertListToDict(languagesList, "code")
  return languagesListDict
}

export function useSynchedLanguagesDict(): [(Record<string, Languages> | undefined), ((newValue: Record<string, Languages>, timestampe?: number) => void), (number | undefined)] {
  const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourceRaw<Languages>(PersistentStore.languages);
  const demo = useIsDemo()
  let lastUpdate = resourcesRaw?.lastUpdate;
  let usedResources = resourcesOnly;
  if(demo) {
    usedResources = getDemoResources()
  }
  return [usedResources, setResourcesOnly, lastUpdate]
}

export function useSynchedLanguageByCode(code: string): Languages | undefined {
    const [resources, setResources, lastUpdate] = useSynchedLanguagesDict()
    return resources?.[code]
}

function getDemoResources(): Record<string, Languages> {

  let demoResource: Languages = {
    code: "de-DE",
    name: "Deutsch",
    direction: "ltr",
  }

  return {
    [demoResource.code]: demoResource
  }
}