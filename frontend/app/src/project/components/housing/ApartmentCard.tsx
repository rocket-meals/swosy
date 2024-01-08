import React, {FunctionComponent, useEffect} from "react";
import {useSynchedApartment} from "../../helper/synchedJSONState";
import {BuildingsCard} from "../buildings/BuildingsCard";
import {Navigation, NavigatorHelper} from "../../../kitcheningredients";
import {ImageFullscreen} from "../../screens/other/ImageFullscreen";
import {ApartmentContent} from "../../screens/housing/ApartmentContent";
import {ImageOverlays} from "../imageOverlays/ImageOverlays";
import {ImageOverlay} from "../imageOverlays/ImageOverlay";
import {DateHelper} from "../../helper/DateHelper";


interface AppState {
	resource_id?: any,
	onPress?: (resourceId: string | number) => void,
	highlight?: boolean,
	small?: boolean,
	withoutOverlay?: boolean,
}
export const ApartmentCard: FunctionComponent<AppState> = (props) => {

	const resource_id = props?.resource_id;
	const resource = useSynchedApartment(resource_id);
	const resourceId = resource?.id;

	const apartment = resource;
	const buildingResourceId = apartment?.building;

	const handicapped_accessible = apartment?.handicapped_accessible;
	const family_friendly = apartment?.family_friendly;
	const singleflat = apartment?.singleflat;
	const available_from = apartment?.available_from;

	let small = true;
	if(props?.small!==undefined && props?.small!==null){
		small = props.small;
	}

	// corresponding componentDidMount
	useEffect(() => {

	}, [props])

	function onPress(){
		if(!!props.onPress && !!resourceId){
			props.onPress(resourceId);
		} else if(!!resourceId) {
			if(small){
				Navigation.navigateTo(ApartmentContent, {id: resourceId, showbackbutton: true})
//				NavigatorHelper.navigateWithoutParams(ApartmentContent, false, {id: resourceId, showbackbutton: true})
			} else {
				let assetId = resource?.image;
				if(!!assetId){
					//TODO Refactor FoodImageFullscreen into FullscreenImage and pass only the assetId
					Navigation.navigateTo(ImageFullscreen, {id: assetId, showbackbutton: true})
//					NavigatorHelper.navigateWithoutParams(ImageFullscreen, false, {id: assetId, showbackbutton: true});
				}
			}
		}
	}

	function renderOverlays(){
		let overlays = [];
		if(!!handicapped_accessible){
			overlays.push(<ImageOverlay image_overlay_id={"apartments_handicapped_accessible"} />)
		}
		if(!!family_friendly){
			overlays.push(<ImageOverlay image_overlay_id={"apartments_family_friendly"} />)
		}
		if(!!singleflat){
			overlays.push(<ImageOverlay image_overlay_id={"apartments_singleflat"} />)
		}
		if(!!available_from){
			overlays.push(<ImageOverlay image_overlay_id={"apartment_available"} params={{
				date: DateHelper.formatOfferDateToReadable(available_from, true)
			}} />)
		}
		return overlays;
	}

	return(
		<BuildingsCard resource_id={buildingResourceId} small={small} withoutOverlay={props?.withoutOverlay} onPress={onPress} renderCustomOverlay={
			(width) => {
				return (
					<ImageOverlays width={width}>
						{renderOverlays()}
					</ImageOverlays>
				)
			}
		}  />
	)
}
