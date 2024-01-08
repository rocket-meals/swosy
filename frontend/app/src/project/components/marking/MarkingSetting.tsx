import React, {FunctionComponent, useCallback, useState} from "react";
import {HStack, Text, Tooltip, View} from "native-base";
import {DirectusImage, Icon, KitchenSkeleton, DirectusIcon} from "../../../kitcheningredients";
import {useSynchedProfile} from "../profile/ProfileAPI";
import {SettingsRow} from "../settings/SettingsRow";
import {TouchableOpacity, Image} from "react-native";
import {useSynchedProfileMarking} from "../profile/MarkingAPI";
import {DebugIcon} from "../icons/DebugIcon";
import {useDebugMode} from "../../helper/synchedJSONState";
import {MarkingName} from "./MarkingName";
import {Markings} from "../../directusTypes/types";
import {DetailsCardBorder} from "../detailsComponent/DetailsCardBorder";
import {useAppTranslation} from "../translations/AppTranslation";
import {useMarkingName} from "./UseMarkingName";
import {MyTouchableOpacity} from "../buttons/MyTouchableOpacity";
import {AccessibilityRoles} from "../../../kitcheningredients/helper/AccessibilityRoles";

interface AppState {
	marking: Markings,
	onPress?: () => any
}
export const MarkingSetting: FunctionComponent<AppState> = (props) => {

	const marking = props?.marking || {};
	let markingId = marking?.id;

	const onPress = props?.onPress;

	const markingName = useMarkingName(marking);

	const [profile, setProfile] = useSynchedProfile();
	const [profileMarking, setProfileMarking, removeProfileMarking] = useSynchedProfileMarking(markingId);

	const translation_marking_like = useAppTranslation("marking_like");
	const translation_marking_like_undo = useAppTranslation("marking_like_undo");
	const translation_marking_dislike = useAppTranslation("marking_dislike");
	const translation_marking_dislike_undo = useAppTranslation("marking_dislike_undo");

	const [debug, setDebug] = useDebugMode()
	const [showMore, setShowMore] = useState(false);

	let dislikes = profileMarking?.dislikes;
	let likes = dislikes===false;

	const handleSelect = useCallback((nextDislikeState) => {
		if (!!profile) {
			if (nextDislikeState === true || nextDislikeState === false) {
				setProfileMarking(nextDislikeState);
			} else {
				removeProfileMarking();
			}
		}
		if (!!onPress) {
			onPress(marking, nextDislikeState);
		}
	}, [profile, onPress, setProfileMarking, removeProfileMarking]);

	const renderLikeState = useCallback(() => {
		const handleLikePress = () => { handleSelect(undefined) };
		const handleUnlikePress = () => { handleSelect(false) };

		const accessibilityLabel = likes ? translation_marking_like_undo : translation_marking_like;
		const iconName = likes ? "thumb-up" : "thumb-up-outline";

		return (
			<MyTouchableOpacity
					accessibilityState={{checked: likes}}
					accessibilityRole={AccessibilityRoles.switch}
					accessibilityLabel={`${accessibilityLabel}: ${markingName}`}
					onPress={likes ? handleLikePress : handleUnlikePress}>
					<Icon name={iconName} />
			</MyTouchableOpacity>
		);
	}, [likes, handleSelect, translation_marking_like, translation_marking_like_undo, markingName]);


	function renderDislikeState(){
		let onPress = () => {handleSelect(undefined)};
		let accessibilityLabel = translation_marking_dislike_undo;
		let iconName = "thumb-down";
		if(!dislikes){
			onPress = () => {handleSelect(true)};
			accessibilityLabel = translation_marking_dislike;
			iconName = "thumb-down-outline";
		}

		return(
			<MyTouchableOpacity
				accessibilityState={{checked: dislikes}}
				accessibilityRole={AccessibilityRoles.switch}
				accessibilityLabel={accessibilityLabel+": "+markingName}
				onPress={onPress}>
				<Icon name={iconName} />
			</MyTouchableOpacity>
		)
	}

	function renderSpacer(){
		return <View style={{width: 18}} />
	}

	function renderDebugInformations(){
		if(debug && showMore){
			return(
				<View>
					<Text>{JSON.stringify(profileMarking, null, 2)}</Text>
					<Text>{JSON.stringify(marking, null, 2)}</Text>
				</View>
			)
		}
	}

	function showMoreDebugInformations(){
		if(debug){
			return [
				<TouchableOpacity onPress={() => {
					setShowMore(!showMore)
				}}>
					<DebugIcon />
				</TouchableOpacity>,
				renderSpacer()
			]
		}
	}

	function renderMarkingIcon(marking){
		const width = 24;
		let icon = marking?.icon;
		let image_url = marking?.image_url;
		let image = marking?.image;

		if(!!icon){
			return <DirectusIcon name={icon} width={width} />
		}
		if(!!image_url){
			return <DirectusImage isPublic={true} url={image_url} style={{width: width, height: width}} />
		}
		if(!!image){
			return <DirectusImage assetId={image} style={{width: width, height: width}} />
		}
		return <View style={{opacity: 0}} ><Text selectable={false}><Icon name={"bug"} /></Text></View>
	}

	function renderMarking(marking){
		let content = <Text>{JSON.stringify(marking)}</Text>

		if(!!marking?.id){
			let rowContent = <MarkingName marking={marking} />
			let markingIcon = renderMarkingIcon(marking);

			content = <View style={{flex: 1}}>
				<SettingsRow leftIcon={markingIcon} leftContent={rowContent} rightIcon={<View style={{flexDirection: "row"}}>
					{showMoreDebugInformations()}
					{renderLikeState()}
					{renderSpacer()}
					{renderDislikeState()}
				</View>} />
				{renderDebugInformations()}
				<DetailsCardBorder like={likes} dislike={dislikes} />
			</View>;
		}


		return(
			<HStack alignItems="center" space={4}>
				{content}
			</HStack>
		)
	}

	return(
		<>
			{renderMarking(marking)}
		</>
	)
}
