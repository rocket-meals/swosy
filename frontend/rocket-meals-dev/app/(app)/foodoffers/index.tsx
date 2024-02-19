import {ListRenderItemInfo, StyleSheet} from 'react-native';
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {useFoodOffersForSelectedDate} from "@/states/SynchedFoodOfferStates";
import {MyGridFlatList} from "@/components/grid/MyGridFlatList";
import {DirectusFiles, Foodoffers, Foods} from "@/helper/database/databaseTypes/types";
import {MyCardForResourcesWithImage} from "@/components/card/MyCardForResourcesWithImage";
import {useMyGridListDefaultColumns} from "@/components/grid/MyGridFlatListDefaultColumns";
import {View} from "@/components/Themed";
import {useSynchedProfileCanteen} from "@/states/SynchedProfile";
import {CanteenSelectionRequired, useIsValidCanteenSelected} from "@/compositions/foodoffers/CanteenSelectionRequired";

export default function FoodOfferScreen() {

  const [foodOffers, setFoodOffers] = useFoodOffersForSelectedDate();
  const isValidCanteenSelected = useIsValidCanteenSelected();


  const initialAmountColumns = useMyGridListDefaultColumns();

  type DataItem = { key: string; data: Foodoffers }

  let data: DataItem[] = []
  if(foodOffers) {
    for (let i = 0; i < foodOffers.length; i++) {
      const foodOffer = foodOffers[i];
      data.push({
        key: foodOffer.id + "", data: foodOffer
      })
    }
  }

    const renderItem = (info: ListRenderItemInfo<DataItem>) => {
      const {item, index} = info;
      const foodOffer = item.data;
      const food = foodOffer.food;
      let title: string | null | undefined = foodOffer.id+""
      let assetId: string | DirectusFiles | null | undefined = undefined
      let image_url: string | undefined = undefined
      let thumb_hash: string | undefined = undefined
      if(typeof food !== "string"){
        if(food?.image){
            assetId = food.image
        }
        if(food?.image_remote_url){
            image_url = food.image_remote_url
        }
        if(food?.image_thumb_hash){
            thumb_hash = food.image_thumb_hash
        }
        if(food?.alias){
            title = food.alias
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

  if(!isValidCanteenSelected){
      return (
          <MySafeAreaView>
              <CanteenSelectionRequired />
          </MySafeAreaView>
      )
  } else {
      return (
          <MySafeAreaView>
              <MyGridFlatList
                  data={data} renderItem={renderItem} gridAmount={initialAmountColumns} />
          </MySafeAreaView>
      );
  }
  }