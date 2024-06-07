import {ListRenderItemInfo} from 'react-native';
import {MySafeAreaViewThemed} from '@/components/MySafeAreaViewThemed';
import {MyGridFlatList} from '@/components/grid/MyGridFlatList';
import {DirectusFiles, News} from '@/helper/database/databaseTypes/types';
import {useSynchedNewsDict} from '@/states/SynchedNews';
import {useProfileLanguageCode} from '@/states/SynchedProfile';
import {getDirectusTranslation, TranslationEntry} from '@/helper/translations/DirectusTranslationUseFunction';
import {MarkdownHelper} from '@/helper/string/MarkdownHelper';
import NewsCard from '@/compositions/news/NewsCard';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {SortType, useSynchedSortType} from "@/states/SynchedSortType";
import {LocationType} from "@/helper/geo/LocationType";
import {PersistentStore} from "@/helper/syncState/PersistentStore";

function sortByDateNewestFirst(resources: News[]) {
	resources.sort((a, b) => {
		let dateA = a.date;
		let dateB = b.date;
		let availableFromA_asDate = dateA ? new Date(dateA) : null;
		let availableFromB_asDate = dateB ? new Date(dateB) : null;

		// oldest first - since rooms which will be available far in the future are not interesting
		if(availableFromA_asDate && availableFromB_asDate){
			return availableFromB_asDate.getTime() - availableFromA_asDate.getTime()
		} else if(availableFromA_asDate){
			return -1;
		} else if(availableFromB_asDate){
			return 1;
		}
		return 0;
	});
	return resources;

}

function sortNews(resources: News[], resourcesDict: Record<string, News | null | undefined> | null | undefined, sortType: SortType, languageCode: string, currentLocation: LocationType | null) {
	let copiedResources = [...resources];
	if(sortType === SortType.intelligent){
		// sort first by name, then by eating habits, then by favorite
		let sortOrders = [SortType.date];
		for(const sortOrder of sortOrders){
			copiedResources = sortNews(copiedResources, resourcesDict, sortOrder, languageCode, currentLocation);
		}
	} else if(sortType === SortType.date){
		copiedResources = sortByDateNewestFirst(copiedResources);
	}
	/**
	 else if(sortType === SortType.favorite){
	 copiedResources = sortByFavorite(copiedResources, foodFeedbacksDict);
	 }
	 */
	return copiedResources;
}

export default function NewsScreen() {
	const [newsDict, setNewsDict] = useSynchedNewsDict()
	const [languageCode, setLanguageCode] = useProfileLanguageCode()
	const [sortType, setSortType] = useSynchedSortType(PersistentStore.sortConfigNews);

	const translation_navigate_to = useTranslation(TranslationKeys.navigate_to)
	const translation_news = useTranslation(TranslationKeys.news)

	const initialAmountColumns = 1

	let resources: News[] = [];
	if (newsDict) {
		const resourceKeys = Object.keys(newsDict)
		for (let i = 0; i < resourceKeys.length; i++) {
			const key = resourceKeys[i];
			const building = newsDict[key];
			if (building){
				resources.push(building)
			}
		}
	}

	resources = sortNews(resources, newsDict, sortType, languageCode, null);



  type DataItem = { key: string; data: News }

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

  	let heading: string | null | undefined = resource.id
  	let text: string | null | undefined = undefined;
  	let assetId: string | DirectusFiles | null | undefined = undefined
  	let image_url: string | undefined = undefined
  	let thumb_hash: string | undefined = undefined
  	if (typeof resource !== 'string') {
  		if (resource?.image) {
  			assetId = resource.image
  		}
  		if (resource?.image_remote_url) {
  			image_url = resource.image_remote_url
  		}
  		if (resource?.image_thumb_hash) {
  			thumb_hash = resource.image_thumb_hash
  		}
  		if (resource?.alias) {
  			heading = resource.alias
  		}

  		const translations = resource.translations as TranslationEntry[] | undefined;
  		if (translations) {
  			const translated_title = getDirectusTranslation(languageCode, translations, 'title', false, heading);
  			if (translated_title) {
  				heading = translated_title;
  				heading = MarkdownHelper.removeMarkdownTags(heading);
  				heading = heading.trim();
  			}
  			const translated_content = getDirectusTranslation(languageCode, translations, 'content', false, '');
  			if (!!translated_content && translated_content.length > 0) {
  				text = translated_content;
  				text = MarkdownHelper.removeMarkdownTags(text);
  				text = text.trim();
  			}
  		}
  	}

  	const date_published = resource?.date

  	const accessiblityLabel = translation_navigate_to+': '+translation_news+' '+heading + ' ' + date_published;

  	return (
  		<NewsCard
  			key={item.key}
  			headline={heading}
  			date={date_published}
  			text={text}
  			thumbHash={thumb_hash}
  			image_url={image_url}
  			assetId={assetId}
  			url={resource.url}
  			accessibilityLabel={accessiblityLabel}
  		/>
  	);
  }

  return (
  	<MySafeAreaViewThemed>
  		<MyGridFlatList
  			data={data}
  			renderItem={renderItem}
  			amountColumns={initialAmountColumns}
  		/>
  	</MySafeAreaViewThemed>
  );
}