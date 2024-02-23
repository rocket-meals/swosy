import {ListRenderItemInfo, StyleSheet} from 'react-native';
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {useFoodOffersForSelectedDate} from "@/states/SynchedFoodOfferStates";
import {MyGridFlatList} from "@/components/grid/MyGridFlatList";
import {Apartments, Buildings, DirectusFiles, Foodoffers, Foods} from "@/helper/database/databaseTypes/types";
import {MyCardForResourcesWithImage} from "@/components/card/MyCardForResourcesWithImage";
import {useMyGridListDefaultColumns} from "@/components/grid/MyGridFlatListDefaultColumns";
import {View} from "@/components/Themed";
import {useProfileLanguageCode, useSynchedProfileCanteen} from "@/states/SynchedProfile";
import {CanteenSelectionRequired, useIsValidCanteenSelected} from "@/compositions/foodoffers/CanteenSelectionRequired";
import {useSynchedBuildingsDict} from "@/states/SynchedBuildings";
import {getDirectusTranslation} from "@/helper/translations/DirectusTranslationUseFunction";
import {useSynchedApartmentsDict} from "@/states/SynchedApartments";

export default function HousingScreen() {

  const [apartmentsDict, setApartmentsDict] = useSynchedApartmentsDict()
  const [buildingsDict, setBuildingsDict] = useSynchedBuildingsDict()

  const initialAmountColumns = useMyGridListDefaultColumns();

  let resources = [];
    if(apartmentsDict){
        let buildingsKeys = Object.keys(apartmentsDict)
        for (let i = 0; i < buildingsKeys.length; i++) {
            const key = buildingsKeys[i];
            const building = apartmentsDict[key];
            resources.push(building)
        }
    }

  type DataItem = { key: string; data: Apartments }

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

        if(!!buildingsDict && resource.building && typeof resource.building === "string"){
            const building = buildingsDict[resource.building]

            if(typeof building !== "string"){
                if(building?.image){
                    assetId = building.image
                }
                if(building?.image_remote_url){
                    image_url = building.image_remote_url
                }
                if(building?.image_thumb_hash){
                    thumb_hash = building.image_thumb_hash
                }
                if(building?.alias){
                    title = building.alias
                }
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