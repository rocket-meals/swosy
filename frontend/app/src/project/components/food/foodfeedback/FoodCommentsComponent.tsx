import React, {FunctionComponent, useEffect, useState} from "react";
import {Input, useToast, View} from "native-base";
import {TouchableOpacity} from "react-native";
import {SettingsRow} from "../../settings/SettingsRow";
import {MyThemedBox} from "../../../../kitcheningredients"
import {Icon, useThemeTextColor} from "../../../../kitcheningredients";
import {useSynchedSettingsFoods} from "../../../helper/synchedJSONState";
import {FoodFeedbackAPI} from "./FoodFeedbackAPI";
import {useSynchedProfile, useSynchedProfileCanteen} from "../../profile/ProfileAPI";
import {FoodLoader} from "../FoodLoader";
import {FoodFeedbackList} from "./FoodFeedbackList";
import {PermissionHelperComponent} from "../../../helper/PermissionHelperComponent";
import {AppTranslation, useAppTranslation} from "../../translations/AppTranslation";

export enum CommentType{
	disabled="disabled",
	read = "read",
	write = "write",
	readAndWrite= "readAndWrite",
}
export interface AppState{
	food_id?: any
}
export const FoodCommentsComponent: FunctionComponent<AppState> = (props) => {

	const toast = useToast();

//	let uploadPermission = PermissionHelper.canUpdate("foods_feedbacks", itemImageField);

	const [profile, setProfile] = useSynchedProfile();
	const commentsWriteAComment = useAppTranslation("commentsWriteAComment");
	const commentsBeTheFirstToComment = useAppTranslation("commentsBeTheFirstToComment")

	const textUpdated = useAppTranslation("updated");
	const textDeleted = useAppTranslation("deleted")

	const textColor = useThemeTextColor()

	const [profileCanteenId, setProfileCanteenId] = useSynchedProfileCanteen();

	const [foodSettings, setFoodSettings] = useSynchedSettingsFoods()
	const foodcommentstype = props.foodcommentstype || foodSettings?.comments_type

	const [usersRemoteFeedback, setUsersRemoteFeedback] = useState(undefined);
	const hasUsersRemoteFeedback = usersRemoteFeedback !== undefined;

	const food_id = props.food_id;

	const [synchedFeedbacks, setSynchedFeedbacks] = FoodFeedbackAPI.useSynchedFoodFeedbacks(food_id);
	const feedbacks = synchedFeedbacks || [];

	const feedbacksWithComments = getFeedbacksWithComments(feedbacks);
	let amountFeedbacksWithComments = feedbacksWithComments?.length

	async function load(){
		let reloadedFood = await FoodLoader.loadFoodDetails(food_id);
		setSynchedFeedbacks(reloadedFood?.feedbacks);
		let usersFeedback = await FoodFeedbackAPI.searchUsersFeedback(profile, food_id);
		setUsersRemoteFeedback(usersFeedback);
		if(!!usersFeedback && !!usersFeedback?.comment){
			setCommentText(usersFeedback?.comment);
		}
	}

	useEffect(() => {
		load()
	}, [props])


	if(!foodcommentstype || foodcommentstype===CommentType.disabled){
		return null;
	}

	const [commentText, setCommentText] = useState(usersRemoteFeedback?.comment || "");


	function getFeedbacksWithComments(feedbacks){
		let feedbacksWithComments = [];
		if(!!feedbacks && feedbacks.length > 0){
			for(let feedback of feedbacks){
				if(!!feedback?.comment && feedback?.comment!==""){
					feedbacksWithComments.push(feedback);
				}
			}
		}
		return feedbacksWithComments;
	}

	function renderComments(){
		if(foodcommentstype===CommentType.read || foodcommentstype===CommentType.readAndWrite){
			return (
				<>
					<SettingsRow leftIcon={<AppTranslation id={"comments"} postfix={" ("+amountFeedbacksWithComments+")"} />} />
					<FoodFeedbackList feedbacks={feedbacksWithComments}  />
				</>
			);
		}
		return <SettingsRow leftIcon={<AppTranslation id={"commentsOtherReadingDisabled"} />} />;
	}

	async function handleSyncComment(profile, deleteComment: boolean){
		let text = commentText+"";
		if(text==="" || deleteComment){
			text=null;
		}
		let success = await FoodFeedbackAPI.createOrUpdateComment(profile, food_id, text, profileCanteenId);
		if(!!success){
			let description = !!text ? textUpdated : textDeleted;
			toast.show({
				description: description
			});
			let reloadedFood = await FoodLoader.loadFoodDetails(food_id);
			setSynchedFeedbacks(reloadedFood?.feedbacks);
		}
	}

	function renderOwnComment(){
		if(foodcommentstype===CommentType.write || foodcommentstype===CommentType.readAndWrite){
			let sendIcon = <Icon name={"send"} />

			let placeHolder = commentsWriteAComment;
			if(!amountFeedbacksWithComments){
				placeHolder = commentsBeTheFirstToComment;
			}

			return (
				<View style={{width: "100%"}}>
					<PermissionHelperComponent collection={FoodFeedbackAPI.collection} fields={["comment"]} actions={["create", "update", "delete"]} >
						<MyThemedBox key={"food_name"} _shadeLevel={3} style={{flexDirection: "row", paddingVertical: "1%", paddingHorizontal: "1%"}}>
							<View style={{flexDirection: "row", flex: 1, width: "100%"}}>
								<Input placeholderTextColor={textColor} width={"100%"} numberOfLines={4} size={"lg"} multiline={true} placeholder={placeHolder} style={{flex: 1, flexGrow: 1}} value={commentText} onChangeText={async (text) => {
									setCommentText(text);
									if(hasUsersRemoteFeedback && (!text || text==="")){
										handleSyncComment(profile, true);
									}
								}} />
							</View>
							<View style={{marginHorizontal: 5, marginVertical: 5}}>
								<TouchableOpacity onPress={() => {
									handleSyncComment(profile, false)
								}} style={{justifyContent: "center", flexDirection: "row", backgroundColor: "orange", borderRadius: 10}} >
									<View style={{margin: 10}}>{sendIcon}</View>
								</TouchableOpacity>
							</View>
						</MyThemedBox>
					</PermissionHelperComponent>
				</View>
			);
		}
		return <SettingsRow leftIcon={<AppTranslation id={"commentsWritingCommentsDisabled"} />} />;
	}

	return (
		<View>
			{renderOwnComment()}
			{renderComments()}
		</View>
	);
}
