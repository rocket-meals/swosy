import {ListRenderItemInfo} from 'react-native';
import {MySafeAreaView} from '@/components/MySafeAreaView';
import {MyGridFlatList} from '@/components/grid/MyGridFlatList';
import {Apartments, DirectusFiles} from '@/helper/database/databaseTypes/types';
import {MyCardForResourcesWithImage} from '@/components/card/MyCardForResourcesWithImage';
import {useMyGridListDefaultColumns} from '@/components/grid/MyGridFlatListDefaultColumns';
import {useSynchedBuildingsDict} from '@/states/SynchedBuildings';
import {useSynchedApartmentsDict} from '@/states/SynchedApartments';
import {useSynchedAppSettings} from "@/states/SynchedAppSettings";
import {useProfileLanguageCode} from "@/states/SynchedProfile";
import {getDirectusTranslation, TranslationEntry} from "@/helper/translations/DirectusTranslationUseFunction";
import {ThemedMarkdown} from "@/components/markdown/ThemedMarkdown";
import {View} from "@/components/Themed";
import {MyCardDefaultBorderRadius} from "@/components/card/MyCard";

function useHousingAdditionalInformationMarkdown(): string {
	const [appSettings] = useSynchedAppSettings();
	let [languageCode, setLanguage] = useProfileLanguageCode();
	let translations = appSettings?.housing_translations
	let usedTranslations = translations || [] as TranslationEntry[]
	return getDirectusTranslation(languageCode, usedTranslations, "content")
}

export default function HousingScreen() {
	const [apartmentsDict, setApartmentsDict] = useSynchedApartmentsDict()
	const [buildingsDict, setBuildingsDict] = useSynchedBuildingsDict()
	const additionalInformationMarkdown = useHousingAdditionalInformationMarkdown()

	const initialAmountColumns = useMyGridListDefaultColumns();

	const resources = [];
	if (apartmentsDict) {
		const buildingsKeys = Object.keys(apartmentsDict)
		for (let i = 0; i < buildingsKeys.length; i++) {
			const key = buildingsKeys[i];
			const building = apartmentsDict[key];
			resources.push(building)
		}
	}

  type DataItem = { key: string; data: Apartments }

  const data: DataItem[] = []
  if (resources) {
  	for (let i = 0; i < resources.length; i++) {
  		const resource = resources[i];
  		data.push({
  			key: resource.id + '', data: resource
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

  	if (!!buildingsDict && resource.building && typeof resource.building === 'string') {
  		const building = buildingsDict[resource.building]

  		if (typeof building !== 'string') {
  			if (building?.image) {
  				assetId = building.image
  			}
  			if (building?.image_remote_url) {
  				image_url = building.image_remote_url
  			}
  			if (building?.image_thumb_hash) {
  				thumb_hash = building.image_thumb_hash
  			}
  			if (building?.alias) {
  				title = building.alias
  			}
  		}
  	}

  	return (
  		<MyCardForResourcesWithImage
  			key={item.key}
  			heading={title}
  			thumbHash={thumb_hash}
  			image_url={image_url}
  			assetId={assetId}
  			onPress={() => console.log('Pressed')}
  			accessibilityLabel={title}
  		/>
  	);
  }

  function renderAdditionalInformation() {
	  if(!!additionalInformationMarkdown){
		  const borderRaidus = MyCardDefaultBorderRadius
		  return (
			  <View style={{width: '100%'}}>
				  <View style={{backgroundColor: undefined, padding: 10, width: '100%', borderBottomLeftRadius: borderRaidus, borderBottomRightRadius: borderRaidus, height: "100%"}}>
					<ThemedMarkdown markdown={additionalInformationMarkdown} />
				  </View>
			  </View>
		  )
	  }
  }

  return (
  	<MySafeAreaView>
  		<MyGridFlatList
			flatListProps={{
				ListHeaderComponent: renderAdditionalInformation()
			}}
  			data={data}
  			renderItem={renderItem}
  			amountColumns={initialAmountColumns}
  		/>
  	</MySafeAreaView>
  );
}