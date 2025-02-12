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

export const useSortedCanteens = () => {
	const [canteenDict, setCanteenDict] = useSynchedCanteensDict();
	const canteen_keys = Object.keys(canteenDict || {});
	canteen_keys.sort((a, b) => {
		const canteen_a = canteenDict[a];
		const canteen_b = canteenDict[b];
		if (!canteen_a || !canteen_b) {
			return 0;
		}
		let canteenAShouldBeFirst = -1;
		let canteenBShouldBeFirst = 1;

		// if status is archived, it should be last
		if (canteen_a.status === ItemStatus.ARCHIVED && canteen_b.status !== ItemStatus.ARCHIVED) {
			return canteenBShouldBeFirst;
		}
		if (canteen_b.status === ItemStatus.ARCHIVED && canteen_a.status !== ItemStatus.ARCHIVED) {
			return canteenAShouldBeFirst;
		}

		// otherwise, sort by sort order
		let canteen_a_sort = canteen_a.sort;
		let canteen_b_sort = canteen_b.sort;

		if (canteen_a_sort === canteen_b_sort) {
			return 0;
		}
		if(canteen_a_sort === undefined || canteen_a_sort === null){
			return canteenBShouldBeFirst;
		}
		if(canteen_b_sort === undefined || canteen_b_sort === null){
			return canteenAShouldBeFirst;
		}
		if(canteen_a_sort < canteen_b_sort){
			return canteenAShouldBeFirst;
		} else if (canteen_a_sort > canteen_b_sort){
			return canteenBShouldBeFirst;
		} else {
			return 0;
		}


	});
	return canteen_keys.map((key) => canteenDict[key]);
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

	let sortedCanteens = useSortedCanteens()
    if (canteenDict) {
    	for (let i = 0; i < sortedCanteens.length; i++) {
    		const canteen = sortedCanteens[i];
			const canteen_key = canteen.id + ''
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
