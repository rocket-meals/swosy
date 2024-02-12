import {PersistentStore} from "@/helper/syncState/PersistentStore";
import {Wikis} from "@/helper/database/databaseTypes/types";
import {useSynchedResourceRaw} from "@/states/SynchedResource";
import {useIsDemo} from "@/states/SynchedDemo";

export enum Custom_Wiki_Ids {
    about_us = "about_us",
    license = "license",
    privacy_policy = "privacy_policy",
    cookieComponentConsent = "cookieComponentConsent",
    cookieComponentAbout = "cookieComponentAbout",
    terms_of_service = "terms_of_service",
    accessibility = "accessibility",
}

export function useSynchedWikisDict(): [(Record<string, Wikis> | undefined), ((newValue: Record<string, Wikis>, timestampe?: number) => void), (number | undefined)] {
  const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourceRaw<Wikis>(PersistentStore.wikis);
  const demo = useIsDemo()
  let lastUpdate = resourcesRaw?.lastUpdate;
  let usedResources = resourcesOnly;
  if(demo) {
    usedResources = getDemoWikis()
  }
  return [usedResources, setResourcesOnly, lastUpdate]
}

export function useSynchedWikisDictByCustomId(): Record<string, Wikis> {
  const [wikis, setWikis, lastUpdate] = useSynchedWikisDict();
  let dictCustomIdToWiki: Record<string, Wikis> = {}
    if(wikis) {
      let wikiKeys = Object.keys(wikis)
        for(let i = 0; i < wikiKeys.length; i++) {
            let wiki = wikis[wikiKeys[i]]
            if(wiki.custom_id !== undefined){
              dictCustomIdToWiki[wiki.custom_id] = wiki
            }
        }
    }
    return dictCustomIdToWiki;
}

export function useSynchedWikiByCustomId(customId: string): Wikis | undefined {
    const dictCustomIdToWiki = useSynchedWikisDictByCustomId()
    return dictCustomIdToWiki[customId]
}

function getDemoWikis(): Record<string, Wikis> {

  let demoResource: Wikis = {
    children: [],
    translations: [],
    date_created: new Date().toISOString(),
    date_updated: new Date().toISOString(),
    id: 123,
    sort: undefined,
    status: "",
    user_created: undefined,
    user_updated: undefined
  }

  return {
    [demoResource.id]: demoResource
  }
}