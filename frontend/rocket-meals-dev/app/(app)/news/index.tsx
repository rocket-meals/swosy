import {ListRenderItemInfo} from 'react-native';
import {MySafeAreaView} from '@/components/MySafeAreaView';
import {MyGridFlatList} from '@/components/grid/MyGridFlatList';
import { DirectusFiles, News} from '@/helper/database/databaseTypes/types';
import {useSynchedNewsDict} from '@/states/SynchedNews';
import {useProfileLanguageCode} from '@/states/SynchedProfile';
import {TranslationEntry, getDirectusTranslation} from '@/helper/translations/DirectusTranslationUseFunction';
import {MarkdownHelper} from '@/helper/string/MarkdownHelper';
import NewsCard from '@/compositions/news/NewsCard';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';

export default function NewsScreen() {
	const [newsDict, setNewsDict] = useSynchedNewsDict()

	const [languageCode, setLanguageCode] = useProfileLanguageCode()

	const translation_navigate_to = useTranslation(TranslationKeys.navigate_to)
	const translation_news = useTranslation(TranslationKeys.news)

	const initialAmountColumns = 1

	const resources = [];
	if (newsDict) {
		const resourceKeys = Object.keys(newsDict)
		for (let i = 0; i < resourceKeys.length; i++) {
			const key = resourceKeys[i];
			const building = newsDict[key];
			resources.push(building)
		}
	}

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

  	const date_published = resource?.date || resource.date_created;

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
  	<MySafeAreaView>
  		<MyGridFlatList
  			data={data}
  			renderItem={renderItem}
  			amountColumns={initialAmountColumns}
  		/>
  	</MySafeAreaView>
  );
}