import {ListRenderItemInfo} from 'react-native';
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {MyGridFlatList} from "@/components/grid/MyGridFlatList";
import {Buildings, DirectusFiles, News} from "@/helper/database/databaseTypes/types";
import {MyCardForResourcesWithImage} from "@/components/card/MyCardForResourcesWithImage";
import {useMyGridListDefaultColumns} from "@/components/grid/MyGridFlatListDefaultColumns";
import {useSynchedNewsDict} from "@/states/SynchedNews";
import {PlatformHelper} from "@/helper/PlatformHelper";
import {CommonSystemActionHelper} from "@/helper/device/CommonSystemActionHelper";
import {useProfileLanguageCode} from "@/states/SynchedProfile";
import {getDirectusTranslation, TranslationEntry} from "@/helper/translations/DirectusTranslationUseFunction";
import {MarkdownHelper} from "@/helper/string/MarkdownHelper";

export default function NewsScreen() {

  const [newsDict, setNewsDict] = useSynchedNewsDict()

    const [languageCode, setLanguageCode] = useProfileLanguageCode()

  const initialAmountColumns = useMyGridListDefaultColumns();

  let resources = [];
    if(newsDict){
        let resourceKeys = Object.keys(newsDict)
        for (let i = 0; i < resourceKeys.length; i++) {
            const key = resourceKeys[i];
            const building = newsDict[key];
            resources.push(building)
        }
    }

  type DataItem = { key: string; data: News }

  let data: DataItem[] = []
  if(resources) {
    for (let i = 0; i < resources.length; i++) {
      const resource = resources[i];
      data.push({
        key: resource.id + "", data: resource
      })
    }
  }

    const renderItem = (info: ListRenderItemInfo<DataItem>) => {
      const {item, index} = info;
      const resource = item.data;

      let heading: string | null | undefined = resource.id
        let text: string | null | undefined = undefined;
      let assetId: string | DirectusFiles | null | undefined = undefined
      let image_url: string | undefined = undefined
      let thumb_hash: string | undefined = undefined
      if(typeof resource !== "string"){
        if(resource?.image){
            assetId = resource.image
        }
        if(resource?.image_remote_url){
            image_url = resource.image_remote_url
        }
        if(resource?.image_thumb_hash){
            thumb_hash = resource.image_thumb_hash
        }
        if(resource?.alias){
            heading = resource.alias
        }

        const translations = resource.translations as TranslationEntry[] | undefined;
        if(translations){
            let translated_title = getDirectusTranslation(languageCode, translations, "title", false, heading);
            if(!!translated_title) {
                heading = translated_title;
                heading = MarkdownHelper.removeMarkdownTags(heading);
            }
            let translated_content = getDirectusTranslation(languageCode, translations, "content", false, "");
            if(!!translated_content && translated_content.length > 0) {
                text = translated_content;
                text = MarkdownHelper.removeMarkdownTags(text);
            }
        }
      }


      return (
          <MyCardForResourcesWithImage
              key={item.key}
              heading={heading}
              text={text}
              thumbHash={thumb_hash}
              image_url={image_url}
              assetId={assetId}
              onPress={() => {
                  if(resource.url){
                      CommonSystemActionHelper.openExternalURL(resource.url, true)
                  }
              }}
              accessibilityLabel={heading}/>
      );
    }

  return (
      <MySafeAreaView>
          <MyGridFlatList
              data={data} renderItem={renderItem} gridAmount={initialAmountColumns} />
      </MySafeAreaView>
  );
  }