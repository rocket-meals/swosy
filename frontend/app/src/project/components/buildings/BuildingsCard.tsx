import React, {FunctionComponent} from "react";
import {Navigation, useMyContrastColor} from "../../../kitcheningredients";
import {useSynchedBuildingsDict} from "../../helper/synchedJSONState";
import {BuildingsImage} from "./BuildingsImage";
import {BuildingsContent} from "../../screens/buildings/BuildingsContent";
import {BuildingHelper} from "./BuildingHelper";
import {Text} from "native-base";
import {useSynchedProfileBuildingsFavorite} from "../profile/FavoriteBuildingsAPI";
import {BuildingFavoriteSingle} from "./BuildingFavoriteSingle";
import {DefaultComponentCard} from "../detailsComponent/DefaultComponentCard";
import {ImageFullscreen} from "../../screens/other/ImageFullscreen";
import {BuildingsCardOverlayDistance} from "./BuildingsCardOverlayDistance";
import {DefaultComponentCardOverlayBox} from "../detailsComponent/DefaultComponentCardOverlayBox";
import {ImageOverlayPosition, ImageOverlays} from "../imageOverlays/ImageOverlays";
import {useSynchedProfileBuildingsLastVisited} from "../profile/ProfilesBuildingsLastVisitedAPI";
import {DateHelper} from "../../helper/DateHelper";
import {ImageOverlay} from "../imageOverlays/ImageOverlay";
import {ColorHelper} from "../../helper/ColorHelper";

interface AppState {
	resource_id: any,
	small?: boolean,
	withoutOverlay?: boolean,
	renderCustomOverlay?: (width: number) => any,
	onPress?: (id: string | number) => void,
}
export const BuildingsCard: FunctionComponent<AppState> = (props) => {

	const projectColor = ColorHelper.useProjectColor();
	const overlayTextColor = useMyContrastColor(projectColor);

	const resource_id = props?.resource_id;
	const small = props?.small;

	const [buildings, setBuildings] = useSynchedBuildingsDict()
	const [profileBuildingFavorite, addProfileFavoriteBuildingSingle, removeProfileFavoriteSingle] = useSynchedProfileBuildingsFavorite(resource_id);
	const isActive = !!profileBuildingFavorite;

	const amountOfLines = 3;
	let resource = buildings[resource_id];
	const resourceId = resource?.id;

	const [profileBuildingLastVisited, updateProfileBuildingLastVisitedSingle, removeProfileBuildingLastVisitedSingle] = useSynchedProfileBuildingsLastVisited(resourceId);

	const title = BuildingHelper.getName(resource);

	const onPress = () => {
		if(!!props.onPress && !!resourceId){
			props.onPress(resourceId);
		} else {
			if(small){
				Navigation.navigateTo(BuildingsContent, {id: resourceId, showbackbutton: true})
//				NavigatorHelper.navigateWithoutParams(BuildingsContent, false, {id: resourceId, showbackbutton: true})
			} else {
				let assetId = resource?.image;
				if(!!assetId){
					//TODO Refactor FoodImageFullscreen into FullscreenImage and pass only the assetId
					Navigation.navigateTo(ImageFullscreen, {id: assetId, showbackbutton: true});
//					NavigatorHelper.navigateWithoutParams(ImageFullscreen, false, {id: assetId, showbackbutton: true});
				}
			}
		}
	};

	function renderQuickRating(width){
		return(
			<DefaultComponentCardOverlayBox key={"quickRating"} width={width} position={ImageOverlayPosition.TOP_RIGHT} withouthPadding={true}>
				<BuildingFavoriteSingle color={overlayTextColor} resource_id={resource_id} />
			</DefaultComponentCardOverlayBox>
		)
	}

	function renderLastVisited(){
		if(!!profileBuildingLastVisited){
			return(
				<ImageOverlay textColor={overlayTextColor} image_overlay_id={"visited_at"} params={{
					"date": DateHelper.formatOfferDateToReadable(profileBuildingLastVisited?.visited_at, true),
				}} />
			)
		}
	}

	function renderTop(width){
		return(
			<BuildingsImage resource={resource}>

			</BuildingsImage>
		)
	}

	function renderTopForeground(width){
		const overlays = [];
		if(!props?.withoutOverlay){
			overlays.push(<BuildingsCardOverlayDistance resource_id={resourceId} width={width} position={ImageOverlayPosition.BOTTOM_RIGHT} />)
			overlays.push(renderQuickRating(width))
			overlays.push(renderLastVisited())
		}

		let renderedCustomOverlays = null;
		const renderCustomOverlay = props?.renderCustomOverlay;
		if(!!renderCustomOverlay){
			renderedCustomOverlays = renderCustomOverlay(width);
		}

		return(
			<>
				<ImageOverlays width={width}>
					{overlays}
				</ImageOverlays>
				{renderedCustomOverlays}
			</>
		)
	}

	function renderBottom(backgroundColor, textColor){
		return <Text color={textColor} selectable={true} numberOfLines={amountOfLines}>{title}</Text>
	}

	return(
		<DefaultComponentCard accessibilityLabel={title} small={small} onPressTop={onPress} renderTop={renderTop} renderTopForeground={renderTopForeground} renderBottom={renderBottom} liked={isActive} />
	)

}
