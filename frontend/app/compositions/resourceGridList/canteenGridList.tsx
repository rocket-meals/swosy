import {ListRenderItemInfo} from 'react-native';
import React, {FunctionComponent} from 'react';
import {useSynchedCanteensDict} from '@/states/SynchedCanteens';
import {useSynchedBuildingsDict} from '@/states/SynchedBuildings';
import {MyCardForResourcesWithImage} from '@/components/card/MyCardForResourcesWithImage';
import {Canteens} from '@/helper/database/databaseTypes/types';
import {MyGridFlatList} from '@/components/grid/MyGridFlatList';
import {useMyGridListDefaultColumns} from '@/components/grid/MyGridFlatListDefaultColumns';
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {useFoodsAreaColor} from "@/states/SynchedAppSettings";
import SimpleBadge from "@/components/badge/SimpleBadge";
import {IconNames} from "@/constants/IconNames";
import SimpleBadgeIconButton from "@/components/badge/SimpleBadgeIconButton";
import {ItemStatus} from "@/helper/database/ItemStatus";

interface AppState {
    onPress?: (canteen: Canteens) => void;
	showArchived?: boolean;
}


export const getCanteenName = (canteen: Canteens | null | undefined) => {
	if (!canteen) {
		return undefined
	}
	return canteen.alias || canteen.id+''
}

export const CanteenGridList: FunctionComponent<AppState> = ({onPress, ...props}) => {
	const [canteenDict, setCanteenDict] = useSynchedCanteensDict();
	const [buildingsDict, setBuildingsDict] = useSynchedBuildingsDict()

	const showArchived = props.showArchived || false

	const translation_select = useTranslation(TranslationKeys.select);
	const translation_archived = useTranslation(TranslationKeys.archived);

	const amountColumns = useMyGridListDefaultColumns();

	const foodsAreaColor = useFoodsAreaColor();

    type DataItem = { key: string; data: Canteens }
    const data: DataItem[] = []
    if (canteenDict) {
    	const canteen_keys = Object.keys(canteenDict);
    	for (let i=0; i<canteen_keys.length; i++) {
    		const canteen_key = canteen_keys[i];
    		const canteen = canteenDict[canteen_key]
    		if(!!canteen) {
				let addCanteen = true
				if (!showArchived && canteen.status === ItemStatus.ARCHIVED) {
					addCanteen = false
				}

				if(addCanteen){
					data.push({key: canteen_key, data: canteen})
				}
			}
    	}
    }

    const renderCanteen = (info: ListRenderItemInfo<DataItem>) => {
    	const {item, index} = info;
    	const canteen = item.data;

    	let building = undefined;
    	let imageAssetId = undefined
    	let image_url = undefined
    	let thumbHash = undefined
    	if (buildingsDict) {
    		building = buildingsDict[canteen?.building as string];
    		imageAssetId = building?.image;
    		thumbHash = building?.image_thumb_hash
    		image_url = building?.image_remote_url
    	}

    	const canteen_label: string = getCanteenName(canteen)
    	const text = canteen_label
		const accessibilityLabel = translation_select + ': ' + canteen_label

    	const onPressCanteen = () => {
    		if (onPress) {
    			onPress(canteen)
    		}
    	}

		const topRightComponent = canteen.status === ItemStatus.ARCHIVED ? (
			<SimpleBadgeIconButton icon={IconNames.archived_icon} accessibilityLabel={translation_archived}/>
		) : undefined

    	return (
    		<MyCardForResourcesWithImage
    			key={item.key}
    			heading={text}
				separatorColor={foodsAreaColor}
				topRightComponent={topRightComponent}
    			assetId={imageAssetId}
    			image_url={image_url}
    			thumbHash={thumbHash}
    			onPress={onPressCanteen}
    			accessibilityLabel={accessibilityLabel}
    		/>
    	);
    }

    return (
    	<MyGridFlatList data={data} renderItem={renderCanteen} amountColumns={amountColumns} />
    );
}
