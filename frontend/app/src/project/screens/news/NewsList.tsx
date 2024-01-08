import React, {FunctionComponent, useEffect} from "react";
import {View, Text} from "native-base";
import {useSynchedNews, useSynchedSettingsNews} from "../../helper/synchedJSONState";
import {NewsCard} from "./NewsCard";
import {GridList} from "../../components/GridList";
import {AnimationSeemsEmpty} from "../../components/animations/AnimationSeemsEmpty";
import {DirectusTranslatedMarkdown} from "../../components/translations/DirectusTranslatedMarkdown";
import {DefaultComponentCard} from "../../components/detailsComponent/DefaultComponentCard";
import {useAppTranslation} from "../../components/translations/AppTranslation";
import {MyButton} from "../../components/buttons/MyButton";
import {ExternalLinksIcon} from "../../components/icons/ExternalLinkIcon";
import {CommonSystemActionHelper} from "../../helper/SystemActionHelper";

const readMoreUrl = "http://www.studentenwerk-hannover.de/unternehmen/news"

export const NewsList: FunctionComponent = (props) => {

	const translationMoreInformation = useAppTranslation("moreInformations");

	const [newsSettings, setNewsSettings] = useSynchedSettingsNews();
	const url_show_more = newsSettings?.url_show_more;

	const [news, setNews] = useSynchedNews();
	//console.log("NewsList", news);
	let resources = news;

	// corresponding componentDidMount
	useEffect(() => {
	}, [props?.route?.params]);

	function renderNews(){
		let output = [];

		let resourceIds = Object.keys(resources || {});

		if(resourceIds.length===0){
			return <AnimationSeemsEmpty />
		}

		let amountItemsTotal = resourceIds.length;
		let amountItemsToShow = amountItemsTotal;
		amountItemsToShow = 10;
		for(let index = 0; index<amountItemsToShow; index++){
			let resourceId = resourceIds[amountItemsTotal-index-1];
			output.push(<NewsCard key={resourceId} resource_id={resourceId} />)
		}

		return (
			<GridList
				//useFlatList={true}
				paddingHorizontal={"2%"}
				paddingVertical={"2%"}
				beakpointsColumns={{
					base: 1
				}}
				style={{flex: 1}} >
				{output}
			</GridList>
		);
	}

	function renderBottom(backgroundColor, textColor){
		if(!!url_show_more){
			return <View>
				<MyButton
					onPress={() => {
						CommonSystemActionHelper.openExternalURL(url_show_more)
					}}
					accessibilityLabel={translationMoreInformation} label={translationMoreInformation}
					renderIcon={(backgroundColor, textColor) => {
						return <ExternalLinksIcon color={textColor} />
					}}
				/>
			</View>
		}
		return null;
	}

	return(
		<View style={{width: "100%", height: "100%"}}>
			{renderNews()}
			<DefaultComponentCard variableHeight={true} positionBottom={true} small={true} renderTop={() => <View></View>} renderTopForeground={null} renderBottom={renderBottom} />
		</View>
	)
}
