import React, {FunctionComponent, useEffect} from "react";
import {BaseNoPaddingTemplate, BasePadding, Layout, Navigation, NavigatorHelper} from "../../../kitcheningredients";
import {Button, Text, View} from "native-base";
import {useSynchedNews} from "../../helper/synchedJSONState";
import {DirectusTranslatedMarkdown} from "../../components/translations/DirectusTranslatedMarkdown";
import {useDirectusTranslation} from "../../components/translations/DirectusTranslationUseFunction";
import {ImageFullscreen} from "../other/ImageFullscreen";
import {NewsImage} from "./NewsImage";
import {AppTranslation, useAppTranslation} from "../../components/translations/AppTranslation";
import {DefaultComponentCard} from "../../components/detailsComponent/DefaultComponentCard";
import {MyButton} from "../../components/buttons/MyButton";
import {CommonSystemActionHelper} from "../../helper/SystemActionHelper";
import {ExternalLinksIcon} from "../../components/icons/ExternalLinkIcon";

export const NewsContent: FunctionComponent = (props) => {

	const amountOfLines = 3;
	const [news, setNews] = useSynchedNews();

	let resource = undefined;
	const news_id = props?.route?.params?.id;
	if(!!news_id){
		resource = news[news_id];
	}

	const translations = resource?.translations;
	const title = useAppTranslation("news");
	const news_title = useDirectusTranslation(translations, "title");

	const openURL = useAppTranslation("openURL");
	const noURLFound = useAppTranslation("noURLFound");
	const moreInformations = useAppTranslation("moreInformations");


	// corresponding componentDidMount
	useEffect(() => {
	}, [props]);

	function renderUrl(){
		let url = resource?.url;
		let text = !!url ? openURL : noURLFound;

		return(
			<View>
				<Text>{moreInformations+":"}</Text>
				<MyButton renderIcon={(backgroundColor, textColor) => {
					return <ExternalLinksIcon color={textColor} />
				}} label={text} accessibilityLabel={text} key={"url"} disabled={!url} onPress={() => {
					CommonSystemActionHelper.openExternalURL(url)
				}} >
				</MyButton>
			</View>
		)
	}

	function renderTopPart(){
		return(
			<NewsImage resource={resource} />
		)
	}

	function onPress(){
		let id = resource?.id;
		let assetId = resource?.image;
		if(!!id && !!assetId){
			//TODO Refactor FoodImageFullscreen into FullscreenImage and pass only the assetId
			Navigation.navigateTo(ImageFullscreen, {id: assetId, showbackbutton: true})
//			NavigatorHelper.navigateWithoutParams(ImageFullscreen, false, {id: assetId, showbackbutton: true});
		}
	}

	function renderName(backgroundColor, textColor){
		return <Text color={textColor} selectable={true}>{news_title}</Text>
	}

	return(
		<BaseNoPaddingTemplate title={title} route={{params: {showbackbutton: true}}} >
			<View style={{width: "100%", paddingTop: Layout.padding}}>
				<DefaultComponentCard accessibilityLabel={news_title} small={false} onPressTop={onPress} renderTop={renderTopPart} renderTopForeground={null} renderBottom={renderName} liked={false} disliked={false} />
				<BasePadding>
					<DirectusTranslatedMarkdown item={resource} field={"content"} />
					{renderUrl()}
				</BasePadding>
			</View>
		</BaseNoPaddingTemplate>
	)
}
