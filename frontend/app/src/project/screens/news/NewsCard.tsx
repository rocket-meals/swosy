import React, {FunctionComponent} from "react";
import {Navigation, NavigatorHelper} from "../../../kitcheningredients";
import {Text} from "native-base";
import {useDirectusTranslation} from "../../components/translations/DirectusTranslationUseFunction";
import {NewsContent} from "./NewsContent";
import {DateHelper} from "../../helper/DateHelper";
import {NewsImage} from "./NewsImage";
import {DetailsCardHorizontal} from "../../components/detailsComponent/DetailsCardHorizontal";
import {useSynchedNews} from "../../helper/synchedJSONState";

interface AppState {
	resource_id: any
}
export const NewsCard: FunctionComponent<AppState> = (props) => {

	const [news, setNews] = useSynchedNews();
	let resource = news[props?.resource_id];
	const date_created = resource?.date_created;

	const translations = resource?.translations;
	const title = useDirectusTranslation(translations, "title");
	const content = useDirectusTranslation(translations, "content");


	function renderDate(){
		let renderedText = DateHelper.formatOfferDateToReadable(date_created, true);
		if(!renderedText){
			renderedText = "??.??.????"
		}

		return(
			renderedText
		)
	}

	const onPress = () => {
		Navigation.navigateTo(NewsContent, {id: resource?.id, showbackbutton: true})
//		NavigatorHelper.navigateWithoutParams(NewsContent, false, {id: resource?.id, showbackbutton: true})
	};

	return(
		<DetailsCardHorizontal teaser={content} onPress={onPress} title={title} image={<NewsImage resource={resource} />} bottomText={renderDate()} >

		</DetailsCardHorizontal>
	)

}
