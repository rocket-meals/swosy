import {ListRenderItemInfo, StyleSheet} from 'react-native';
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {useFoodOffersForSelectedDate} from "@/states/SynchedFoodOfferStates";
import {MyGridFlatList} from "@/components/grid/MyGridFlatList";
import {Buildings, DirectusFiles, Foodoffers, Foods} from "@/helper/database/databaseTypes/types";
import {MyCardForResourcesWithImage} from "@/components/card/MyCardForResourcesWithImage";
import {useMyGridListDefaultColumns} from "@/components/grid/MyGridFlatListDefaultColumns";
import {View} from "@/components/Themed";
import {useProfileLanguageCode, useSynchedProfileCanteen} from "@/states/SynchedProfile";
import {CanteenSelectionRequired, useIsValidCanteenSelected} from "@/compositions/foodoffers/CanteenSelectionRequired";
import {useSynchedBuildingsDict} from "@/states/SynchedBuildings";
import {getDirectusTranslation} from "@/helper/translations/DirectusTranslationUseFunction";

export default function BuildingsScreen() {

  const [buildingsDict, setBuildingsDict] = useSynchedBuildingsDict()
    const [languageCode, setLanguageCode] = useProfileLanguageCode()

  const initialAmountColumns = useMyGridListDefaultColumns();

  let resources = [];
    if(buildingsDict){
        let buildingsKeys = Object.keys(buildingsDict)
        for (let i = 0; i < buildingsKeys.length; i++) {
            const key = buildingsKeys[i];
            const building = buildingsDict[key];
            resources.push(building)
        }
    }

  type DataItem = { key: string; data: Buildings }

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
              onPress={() => console.log("Pressed")}
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