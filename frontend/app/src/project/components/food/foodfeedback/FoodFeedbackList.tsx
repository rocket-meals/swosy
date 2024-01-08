import React, {FunctionComponent, useEffect, useState} from "react";
import {Text, View} from "native-base";
import {SettingsRow} from "../../settings/SettingsRow";
import {MyActionsheet} from "../../../../kitcheningredients";
import {SettingsSpacer} from "../../settings/SettingsSpacer";
import {FoodFeedbackRow} from "./FoodFeedbackRow";
import {FoodFeedbackHelper} from "../../../helper/FoodFeedbackHelper";
import {AppTranslation, useAppTranslation} from "../../translations/AppTranslation";
import {PermissionHelper} from "../../../helper/PermissionHelper";

export enum FoodFeedbackSortType{
	newest = "newest",
	oldest = "oldest",
	most_liked = "most_liked",
	most_disliked = "most_disliked",
}

export interface AppState{
	feedbacks?: any
	customRender?: any
}
export const FoodFeedbackList: FunctionComponent<AppState> = (props) => {

	// corresponding componentDidMount
	useEffect(() => {

	}, [props])

	const feedbacks = props.feedbacks || [];

	const translation = {
		[FoodFeedbackSortType.newest]: useAppTranslation("newest"),
		[FoodFeedbackSortType.oldest]: useAppTranslation("oldest"),
		[FoodFeedbackSortType.most_liked]: useAppTranslation("mostLiked"),
		[FoodFeedbackSortType.most_disliked]: useAppTranslation("mostDisliked"),
	}

	const sortByOptions = Object.keys(translation);

	const [sortBy, setSortBy] = useState(sortByOptions[0]);
	const actionsheet = MyActionsheet.useActionsheet();
	let sortedFeedbacks = sortFeedbacks(feedbacks);


	function sortFeedbacks(feedbacks: any[]) {
		if(!!feedbacks && feedbacks.length > 0){
			if (sortBy === FoodFeedbackSortType.newest) {
				return feedbacks.sort((a, b) => FoodFeedbackHelper.getDate(b) - FoodFeedbackHelper.getDate(a));
			} else if (sortBy === FoodFeedbackSortType.oldest) {
				return feedbacks.sort((a, b) => FoodFeedbackHelper.getDate(a) - FoodFeedbackHelper.getDate(b));
			}  else if (sortBy === FoodFeedbackSortType.most_liked) {
				return feedbacks.sort((a, b) => FoodFeedbackHelper.getRating(b) - FoodFeedbackHelper.getRating(a));
			} else if (sortBy === FoodFeedbackSortType.most_disliked) {
				return feedbacks.sort((a, b) => FoodFeedbackHelper.getRating(a) - FoodFeedbackHelper.getRating(b));
			}
		}

		return feedbacks;
	}

	function renderSortButton(){
		return(
			<>
				<SettingsRow leftContent={<View><AppTranslation id={"sortBy"} postfix={": "+translation[sortBy]} /></View>} leftIcon={"sort"} rightIcon={null} onPress={() => {
					actionsheet.show({
						title: <AppTranslation id={"sortBy"} />,
						onOptionSelect: (key) => {
							//console.log(key);
							setSortBy(key);
						}
					}, translation);
				}} />
				<SettingsSpacer />
			</>
		)
	}

	let output = [];

	if(!!sortedFeedbacks && sortedFeedbacks.length > 0){
		output.push(renderSortButton())
		for(let feedback of feedbacks){
			if(props?.customRender){
				output.push(props.customRender(feedback));
			} else {
				output.push(<FoodFeedbackRow feedback={feedback} />)
			}
		}
	}

	return output;

}
