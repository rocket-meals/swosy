import React, {FunctionComponent, useEffect} from "react";
import {View, Text} from "native-base";
import {TouchableOpacity} from "react-native";
import {MAX_RATING_VALUE, RatingType, RatingValueIcon} from "../ratings/RatingValueIcon";
import {useSynchedProfileBuildingsFavorite} from "../profile/FavoriteBuildingsAPI";
import {ImageOverlayPaddingStyle} from "../imageOverlays/ImageOverlay";
import {MyTouchableOpacity} from "../buttons/MyTouchableOpacity";
import {useAppTranslation} from "../translations/AppTranslation";

export interface AppState{
	resource_id: any,
	ratingValue?: number,
	defaultRatingValue?: number,
	ratingType?: RatingType,
	onSelectRating?: any,
	color?: string,
}
export const BuildingFavoriteSingle: FunctionComponent<AppState> = (props) => {

	const DEFAULT_RATING_TYPE = RatingType.hearts;
	const resource_id = props.resource_id;
	const [profileBuildingFavorite, addProfileFavoriteBuildingSingle, removeProfileFavoriteSingle] = useSynchedProfileBuildingsFavorite(resource_id);

	const translationCurrently = useAppTranslation("currently")
	const translationLike = useAppTranslation("rating_like")
	const translationDislike = useAppTranslation("rating_dislike")

//	const [remoteAppSettings, setRemoteAppSettings] = useSynchedRemoteSettings();
	const ratingType = props.ratingType || DEFAULT_RATING_TYPE // || remoteAppSettings?.foodratingstype

	const isActive = getIsActive();
	const ratingValue = props?.ratingValue || props?.defaultRatingValue || MAX_RATING_VALUE;



	const accessibilityLabelCurrentState = isActive ? translationLike : translationDislike;
	const accessibilityLabel = translationCurrently+": "+accessibilityLabelCurrentState;

	useEffect(() => {

	}, [props]);

	async function handleSelectRating(isActive){
		if(isActive){ // if we click at the rating again, we will delete it instead
			await removeProfileFavoriteSingle();
		} else {
			await addProfileFavoriteBuildingSingle();
		}
	}

	function getIsActive(): boolean {
		switch (ratingType){
			case RatingType.disabled: return false;
			case RatingType.hearts: return !!profileBuildingFavorite;
			case RatingType.likes: return !!profileBuildingFavorite;
			case RatingType.stars: return !!profileBuildingFavorite;
			case RatingType.smilies: return !!profileBuildingFavorite;
			default: return false
		}
	}

	return(
			<View>
				<MyTouchableOpacity
					accessibilityLabel={accessibilityLabel}
					style={ImageOverlayPaddingStyle}
					onPress={() => {
					handleSelectRating(isActive)
				}}>
					<View style={props?.style}>
						<RatingValueIcon color={props?.color} ratingType={ratingType} ratingValue={ratingValue} isActive={isActive} />
					</View>
				</MyTouchableOpacity>
			</View>
	)
}
