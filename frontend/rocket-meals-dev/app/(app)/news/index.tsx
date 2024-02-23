import {ListRenderItemInfo} from 'react-native';
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {MyGridFlatList} from "@/components/grid/MyGridFlatList";
import {Buildings, DirectusFiles, News} from "@/helper/database/databaseTypes/types";
import {MyCardForResourcesWithImage} from "@/components/card/MyCardForResourcesWithImage";
import {useMyGridListDefaultColumns} from "@/components/grid/MyGridFlatListDefaultColumns";
import {useSynchedNewsDict} from "@/states/SynchedNews";
import {PlatformHelper} from "@/helper/PlatformHelper";
import {CommonSystemActionHelper} from "@/helper/device/CommonSystemActionHelper";

export default function NewsScreen() {

  const [newsDict, setNewsDict] = useSynchedNewsDict()

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

      let title: string | null | undefined = resource.id
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
            title = resource.alias
        }
      }


      return (
          <MyCardForResourcesWithImage
              key={item.key}
              text={title}
              thumbHash={thumb_hash}
              image_url={image_url}
              assetId={assetId}
              onPress={() => {
                  if(resource.url){
                      CommonSystemActionHelper.openExternalURL(resource.url, true)
                  }
              }}
              accessibilityLabel={title}/>
      );
    }

  return (
      <MySafeAreaView>
          <MyGridFlatList
              data={data} renderItem={renderItem} gridAmount={initialAmountColumns} />
      </MySafeAreaView>
  );
  }