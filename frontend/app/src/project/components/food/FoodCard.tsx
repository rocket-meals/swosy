import React, {FunctionComponent, useEffect, useState} from "react";
import {Text, useToast, View} from "native-base";
import {FoodImage} from "./FoodImage";
import {StringHelper} from "../../helper/StringHelper";
import {Navigation, NavigatorHelper, useMyContrastColor} from "../../../kitcheningredients";
import {FoodDetails} from "../../screens/food/FoodDetails";
import {Foodoffers, Foods} from "../../directusTypes/types";
import {FormatedPriceText} from "./FormatedPriceText";
import {FoodRatingSingle} from "./foodfeedback/foodrating/FoodRatingSingle";
import {FoodFeedbackAPI} from "./foodfeedback/FoodFeedbackAPI";
import {FoodRatingConstant} from "./foodfeedback/foodrating/FoodRatingConstant";
import {
	countDislikedMarkings,
	getDislikedMarkings,
	useMarkingsFromFoodofferMarkings,
	useSynchedProfileMarkingsDict
} from "../profile/MarkingAPI";
import {MarkingIcon} from "../marking/MarkingIcon";
import {FoodName, useFoodName} from "./FoodName";
import {DefaultComponentCard} from "../detailsComponent/DefaultComponentCard";
import {ImageOverlayPaddingStyle} from "../imageOverlays/ImageOverlay";
import {ImageOverlayPosition, ImageOverlays} from "../imageOverlays/ImageOverlays";
import {DefaultComponentCardOverlayBox} from "../detailsComponent/DefaultComponentCardOverlayBox";
import {MarkingActionSheet} from "../marking/MarkingActionSheet";
import {FoodOfferHelper} from "./FoodOfferHelper";
import {ColorHelper} from "../../helper/ColorHelper";


interface AppState {
	placeholder?: boolean
	food?: Foods,
	onPress?: any,
	hideBottomPartAndQuickRate?: boolean,
	onUpload?: any,
	foodoffer?: Foodoffers
	small?: boolean,
}
export const FoodCard: FunctionComponent<AppState> = (props) => {

	const projectColor = ColorHelper.useProjectColor();
	const overlayTextColor = useMyContrastColor(projectColor);
	const markingBackgroundColor = "#FF0000";
	const markingTextColor = useMyContrastColor(markingBackgroundColor);

	let small = true;
	if(props?.small!==undefined && props?.small!==null){
		small = props.small;
	}

	const foodoffer = props.foodoffer;
	const foodOfferPrice = FoodOfferHelper.useFoodOfferPrice(foodoffer);

	const food = props?.food;
	const foodName = useFoodName(food);

	const food_id = food?.id;
	const placeholder = food===undefined;
	const food_marking_relations = foodoffer?.markings || food?.markings;

	const [ratingValue, setRatingValue] = FoodFeedbackAPI.useOwnFoodRating(food_id);

	const [profilesMarkingsDict, setProfileMarking, removeProfileMarking] = useSynchedProfileMarkingsDict();
	const markings = useMarkingsFromFoodofferMarkings(food_marking_relations);
	const dislikedMarkings = getDislikedMarkings(markings, profilesMarkingsDict);
	const amountOfDislikedMarkings = countDislikedMarkings(markings, profilesMarkingsDict);
	const isDislikedMarking = amountOfDislikedMarkings > 0;
	const isLikeRating = FoodRatingConstant.isLikeRating(ratingValue);
	const isDislikeRating = FoodRatingConstant.isDislikeRating(ratingValue);

	const disliked = isDislikedMarking || isDislikeRating;

	// corresponding componentDidMount
	useEffect(() => {

	}, [props])

	let amountOfLines = 3;

	function renderMarkingWarning(width){
		if(isDislikedMarking){
			return (
				<DefaultComponentCardOverlayBox backgroundColor={markingBackgroundColor} width={width} position={ImageOverlayPosition.TOP_RIGHT} withouthPadding={true} >
						<MarkingActionSheet markings={dislikedMarkings} >
							<View style={ImageOverlayPaddingStyle}>
								<MarkingIcon color={markingTextColor} />
							</View>
						</MarkingActionSheet>
				</DefaultComponentCardOverlayBox>
			)
		}
	}

	function renderQuickRating(width){
		if(props?.hideBottomPartAndQuickRate){
			return null;
		}

		return (
			<DefaultComponentCardOverlayBox width={width} position={ImageOverlayPosition.TOP_RIGHT} withouthPadding={true}>
				<FoodRatingSingle color={overlayTextColor} food_id={food_id} defaultRatingValue={5} />
			</DefaultComponentCardOverlayBox>
		)
	}

	function renderPrice(width, foodoffer){
		let price = foodOfferPrice;

		if(price==null){
			return null;
		}

		return(
			<DefaultComponentCardOverlayBox width={width} position={ImageOverlayPosition.BOTTOM_RIGHT} withouthPadding={false}>
				{StringHelper.renderZeroSpaceHeight()}
				<FormatedPriceText color={overlayTextColor} price={price} />
			</DefaultComponentCardOverlayBox>
		)
	}

	function handlePressImage(){
		if(!!props?.onPress){
			props.onPress(food);
		} else {
			let id = food?.id;
			if(!!id){
				Navigation.navigateTo(FoodDetails, {id: id, showbackbutton: true, foodoffer_id: foodoffer?.id})
//				NavigatorHelper.navigateWithoutParams(FoodDetails, false, {id: id, showbackbutton: true, foodoffer_id: foodoffer?.id});
			}
		}
	}

	function renderTop(width){
		return(
			<FoodImage alt={foodName} key={JSON.stringify(food)} food={food} placeholder={placeholder} onUpload={props.onUpload} >
			</FoodImage>
		)
	}

	function renderTopForeground(width){
		return(
				<ImageOverlays width={width}>
					{renderQuickRating(width)}
					{renderMarkingWarning(width)}
					{renderPrice(width, foodoffer)}
				</ImageOverlays>
		)
	}

	function renderBottom(backgroundColor, textColor){
		return <Text color={textColor} selectable={true} numberOfLines={amountOfLines}>{foodName}</Text>
	}

	return(
		<DefaultComponentCard
			accessibilityLabel={foodName}
			small={small} onPressTop={handlePressImage} renderTop={renderTop} renderTopForeground={renderTopForeground} renderBottom={renderBottom} liked={isLikeRating} disliked={disliked} />
	)
}
