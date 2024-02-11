import {ListRenderItemInfo} from 'react-native';
import React, {FunctionComponent} from "react";
import {useSynchedCanteensDict} from "@/states/SynchedCanteens";
import {useSynchedBuildingsDict} from "@/states/SynchedBuildings";
import {MyCardForResourcesWithImage} from "@/components/card/MyCardForResourcesWithImage";
import {Canteens} from "@/helper/database/databaseTypes/types";
import {MyGridList} from "@/components/grid/MyGridList";
import {useBreakPointValue} from "@/helper/device/DeviceHelper";

interface AppState {
    onPress?: (canteen: Canteens) => void;
}
export const CanteenGridList: FunctionComponent<AppState> = ({onPress, ...props}) => {

  const [canteenDict, setCanteenDict] = useSynchedCanteensDict();
  const [buildingsDict, setBuildingsDict] = useSynchedBuildingsDict()

    const amountColumns = useBreakPointValue({sm: 2, md: 3, lg: 4, xl: 5})

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
        let thumbHash = undefined
        if(buildingsDict){
            building = buildingsDict[canteen?.id];
            imageAssetId = building?.image;
            thumbHash = building?.thumbHash;
        }

        let canteen_label: string = canteen.label || canteen_key+""
        let text = canteen_label

        const onPressCanteen = () => {
            if(onPress){
                onPress(canteen)
            }
        }

        return (
            <MyCardForResourcesWithImage
                key={item.key}
                text={text}
                assetId={imageAssetId}
                thumbHash={thumbHash}
                onPress={onPressCanteen}
                accessibilityLabel={text}/>
        );
    }

  return (
      <MyGridList data={data} renderItem={renderCanteen} gridAmount={amountColumns} />
  );
}
