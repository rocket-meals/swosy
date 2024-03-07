import {ListRenderItemInfo} from 'react-native';
import React, {FunctionComponent} from "react";
import {useSynchedCanteensDict} from "@/states/SynchedCanteens";
import {useSynchedBuildingsDict} from "@/states/SynchedBuildings";
import {MyCardForResourcesWithImage} from "@/components/card/MyCardForResourcesWithImage";
import {Canteens} from "@/helper/database/databaseTypes/types";
import {MyGridFlatList} from "@/components/grid/MyGridFlatList";
import {useBreakPointValue} from "@/helper/device/DeviceHelper";
import {useMyGridListDefaultColumns} from "@/components/grid/MyGridFlatListDefaultColumns";

interface AppState {
    onPress?: (canteen: Canteens) => void;
}
export const CanteenGridList: FunctionComponent<AppState> = ({onPress, ...props}) => {

  const [canteenDict, setCanteenDict] = useSynchedCanteensDict();
  const [buildingsDict, setBuildingsDict] = useSynchedBuildingsDict()

    const amountColumns = useMyGridListDefaultColumns();

    type DataItem = { key: string; data: Canteens }
    let data: DataItem[] = []
  if(canteenDict){
    let canteen_keys = Object.keys(canteenDict);
    for(let i=0; i<canteen_keys.length; i++){
      let canteen_key = canteen_keys[i];
      let canteen = canteenDict[canteen_key]
        data.push({key: canteen_key, data: canteen})
    }
  }

    const renderCanteen = (info: ListRenderItemInfo<DataItem>) => {
        const {item, index} = info;
        const canteen = item.data;
        const canteen_key = canteen.id

        let building = undefined;
        let imageAssetId = undefined
        let image_url = undefined
        let thumbHash = undefined
        if(buildingsDict){
            building = buildingsDict[canteen?.id];
            imageAssetId = building?.image;
            thumbHash = building?.image_thumb_hash
            image_url = building?.image_remote_url
        }

        let canteen_label: string = canteen.alias || canteen_key+""
        let text = canteen_label

        const onPressCanteen = () => {
            if(onPress){
                onPress(canteen)
            }
        }

        return (
            <MyCardForResourcesWithImage
                key={item.key}
                heading={text}
                assetId={imageAssetId}
                image_url={image_url}
                thumbHash={thumbHash}
                onPress={onPressCanteen}
                accessibilityLabel={text}/>
        );
    }

  return (
      <MyGridFlatList data={data} renderItem={renderCanteen} gridAmount={amountColumns} />
  );
}
