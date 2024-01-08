import React, {FunctionComponent, useEffect} from "react";
import {Text} from "native-base";
import {CanteenImage} from "./CanteenImage";
import {DefaultComponentCard} from "../detailsComponent/DefaultComponentCard";
import {useSynchedBuildingsDict, useSynchedCanteen} from "../../helper/synchedJSONState";
import {BuildingsCardOverlayDistance} from "../buildings/BuildingsCardOverlayDistance";
import {CanteenCardOverlayMoreInformation} from "./CanteenCardOverlayMoreInformation";
import {ImageOverlayPosition, ImageOverlays} from "../imageOverlays/ImageOverlays";
import {BuildingHelper} from "../buildings/BuildingHelper";


interface AppState {
	resource_id?: any,
	onPress?: (resourceId: string | number) => void,
	highlight?: boolean,
	small?: boolean,
	withoutOverlay?: boolean,
}
export const CanteenCard: FunctionComponent<AppState> = (props) => {

	const resource_id = props?.resource_id;
	const resource = useSynchedCanteen(resource_id);
	const resourceId = resource?.id;

	const [buildings, setBuildings] = useSynchedBuildingsDict()

	const canteen = resource;
	const buildingResourceId = canteen?.building;

	let resourceBuilding = buildings[resource_id];
	const resourceBuildingTitle = BuildingHelper.getName(resourceBuilding);

	let small = true;
	if(props?.small!==undefined && props?.small!==null){
		small = props.small;
	}

	// corresponding componentDidMount
	useEffect(() => {

	}, [props])

	let amountOfLines = 3;

	function onPress(){
		if(!!props.onPress && !!resourceId){
			props.onPress(resourceId);
		}
	}

	function renderTop(width){
		return(
			<CanteenImage canteen={canteen} width={width} >
			</CanteenImage>
		)
	}

	function renderTopForeground(width){
		const overlays = [];
		if(!props?.withoutOverlay){
			overlays.push(<BuildingsCardOverlayDistance resource_id={buildingResourceId} width={width} position={ImageOverlayPosition.BOTTOM_RIGHT} />)
			overlays.push(<CanteenCardOverlayMoreInformation resource_id={resourceId} width={width} position={ImageOverlayPosition.TOP_RIGHT} />)
		}

		return(
			<ImageOverlays width={width}>
				{overlays}
			</ImageOverlays>
		)
	}

	function renderBottom(backgroundColor, textColor){
		return (
			<>
				<Text color={textColor} numberOfLines={amountOfLines-1}>{canteen?.label}</Text>
			</>
		)
	}

	return(
		<DefaultComponentCard accessibilityLabel={resourceBuildingTitle} small={small} onPressTop={onPress} renderTop={renderTop} renderTopForeground={renderTopForeground} renderBottom={renderBottom} liked={props?.highlight} />
	)
}
