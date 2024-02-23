import {PersistentStore} from "@/helper/syncState/PersistentStore";
import {Apartments, Buildings, Markings, News, NewsTranslations} from "@/helper/database/databaseTypes/types";
import {useSynchedResourceRaw} from "@/states/SynchedResource";
import {useIsDemo} from "@/states/SynchedDemo";
import {CollectionHelper} from "@/helper/database/server/CollectionHelper";
import {DateHelper} from "@/helper/date/DateHelper";
import {DirectusTranslationHelper} from "@/helper/translations/DirectusTranslationHelper";

async function loadNewsFromServer(): Promise<News[]> {
  let collectionHelper = new CollectionHelper<News>("news");

  const fields = ['*', "translations.*"];

  let query = {
    limit: -1,
    fields: fields
  }

  return await collectionHelper.readItems(query);
}

export function useSynchedNewsDict(): [(Record<string, News> | undefined), ((newValue: Record<string, News>, timestampe?: number) => void), (number | undefined), ((nowInMs?: number) => Promise<void>)
] {
  const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourceRaw<News>(PersistentStore.news);
  const demo = useIsDemo()
  let lastUpdate = resourcesRaw?.lastUpdate;
  let usedResources = resourcesOnly;
  if(demo) {
    usedResources = getDemoNews()
  }

  async function updateFromServer(nowInMs?: number) {
    let resourceAsList = await loadNewsFromServer();
    let resourceAsDict = CollectionHelper.convertListToDict(resourceAsList, "id")
    setResourcesOnly(resourceAsDict, nowInMs);
  }

  return [usedResources, setResourcesOnly, lastUpdate, updateFromServer]
}

function getDemoNews(): Record<string, News> {

  let news_id = "demo-news"

  /**
   be_source_for_translations?: boolean | null;
   content?: string | null;
   id: number;
   languages_code?: string | Languages | null;
   let_be_translated?: boolean | null;
   news_id?: string | News | null;
   title?: string | null;
   translation_settings: string;
   */
  let newsTranslations: NewsTranslations = {
    translation_settings: "",
    be_source_for_translations: false,
    content: "Demo Content",
    id: 1,
    news_id: news_id,
    languages_code: DirectusTranslationHelper.DEFAULT_LANGUAGE_CODE_GERMAN
  }

  let demoResource: News = {
    alias: "Demo News",
    date_created: DateHelper.addMinutes(new Date(), -10).toISOString(),
    date_updated: new Date().toISOString(),
    external_identifier: undefined,
    id: news_id,
    image: undefined,
    image_remote_url: undefined,
    image_thumb_hash: undefined,
    sort: undefined,
    status: "",
    translations: [newsTranslations],
    url: undefined,
    user_created: undefined,
    user_updated: undefined

  }

  return {
    [demoResource.id]: demoResource
  }
}