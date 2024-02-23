import {PersistentStore} from "@/helper/syncState/PersistentStore";
import {News, NewsTranslations} from "@/helper/database/databaseTypes/types";
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

function getSingleDemoNews(index: number): News {
  let news_id = "demo-news"+index

  let amountNewsTranslations = 1

  const titles = ["# Demo Neueröffnung unseres Kantinengebäudes!", "# Immer frisch und lecker: Wir haben unsere Speisekarte erweitert!"]
  const contents = [
      "Wir freuen uns, die Eröffnung unseres brandneuen Kantinengebäudes ankündigen zu können! Ab dem 15. März 2024 heißen wir Sie herzlich willkommen, die Vielfalt unserer kulinarischen Angebote zu entdecken. Von klassischen Gerichten bis hin zu internationalen Spezialitäten – für jeden Geschmack ist etwas dabei.\n" +
      "\n" +
      "## Was gibt's Neues?\n" +
      "\n" +
      "- **Moderne Essbereiche**: Genießen Sie Ihre Mahlzeiten in einem angenehmen und modern gestalteten Ambiente.\n" +
      "- **Erweitertes Menüangebot**: Entdecken Sie unsere neuen, saisonalen Menüs, zubereitet mit frischen, lokalen Zutaten.\n" +
      "- **Digitale Bestellung**: Bestellen und bezahlen Sie Ihre Mahlzeiten bequem über unsere App – sparen Sie Zeit und vermeiden Sie Warteschlangen.\n",
      "Hier bei Rocket Meals legen wir großen Wert auf Vielfalt und Qualität. Deshalb haben wir unsere Speisekarte um einige neue, leckere Gerichte erweitert."
    ]

  let newsTranslations: NewsTranslations = {
    translation_settings: "",
    be_source_for_translations: false,
    title: titles[titles.length%index],
    content: contents[contents.length%index],
    id: amountNewsTranslations*index,
    news_id: news_id,
    languages_code: DirectusTranslationHelper.DEFAULT_LANGUAGE_CODE_GERMAN
  }

  let image_remote_urls = [
      "https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fG5ld3N8ZW58MHx8MHx8fDA%3D",
    "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bmV3c3xlbnwwfHwwfHx8MA%3D%3D"
  ]

  return {
      alias: "Demo News",
      date_created: DateHelper.addMinutes(new Date(), -index*10).toISOString(),
      date_updated: new Date().toISOString(),
      external_identifier: undefined,
      id: news_id,
      image: undefined,
      image_remote_url: image_remote_urls[index%image_remote_urls.length],
      image_thumb_hash: undefined,
      sort: undefined,
      status: "",
      translations: [newsTranslations],
      url: undefined,
      user_created: undefined,
      user_updated: undefined

    }
}

function getDemoNews(): Record<string, News> {

  let resourceDict: Record<string, News> = {}

  for (let i = 0; i < 3; i++) {
    let demoResource = getSingleDemoNews(i)
    resourceDict[demoResource.id] = demoResource
  }

  return resourceDict
}