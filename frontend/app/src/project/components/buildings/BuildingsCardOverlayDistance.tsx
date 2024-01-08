import React, {FunctionComponent} from "react";
import {useSynchedBuilding} from "../../helper/synchedJSONState";
import {useNearestLocation} from "../../helper/synchedHelper/useNearestLocation";
import {BuildingHelper} from "./BuildingHelper";
import {Text, Tooltip} from "native-base";
import {ViewPixelRatio} from "../../helper/ViewPixelRatio";
import {StringHelper} from "../../helper/StringHelper";
import {BuildingLocationOpenerComponent} from "./BuildingLocationOpenerComponent";
import {ImageOverlayPosition} from "../imageOverlays/ImageOverlays";
import {DefaultComponentCardOverlayBox} from "../detailsComponent/DefaultComponentCardOverlayBox";
import {ImageOverlayPaddingStyle} from "../imageOverlays/ImageOverlay";
import {ColorHelper} from "../../helper/ColorHelper";
import {useMyContrastColor} from "../../../kitcheningredients";

interface AppState {
	resource_id: any,
	width?: number,
	position?: ImageOverlayPosition,
}
export const BuildingsCardOverlayDistance: FunctionComponent<AppState> = (props) => {

	const resource_id = props?.resource_id;
	const building = useSynchedBuilding(resource_id);
	const nearestLocation = useNearestLocation();

	const projectColor = ColorHelper.useProjectColor();
	const overlayTextColor = useMyContrastColor(projectColor);

	const width = props?.width;

	let resource = building;
	const resourceId = resource?.id;


	let distance = BuildingHelper.getBuildingDistance(resource, nearestLocation);

	let renderedText = "";
	if(distance !== undefined && distance !== null){ // distance can be 0
		let formatedDistance = BuildingHelper.formatBuildingDistance(distance);
		renderedText = formatedDistance
		return(
			<DefaultComponentCardOverlayBox width={width} position={props?.position} withouthPadding={true}>
					<BuildingLocationOpenerComponent resource_id={resourceId} >
						<ViewPixelRatio style={[{flexDirection: "row", justifyContent: "center", minWidth: "25%", alignItems: "flex-end"}, ImageOverlayPaddingStyle]}>
							{StringHelper.renderZeroSpaceHeight()}
							<Text color={overlayTextColor}>{renderedText}</Text>
						</ViewPixelRatio>
					</BuildingLocationOpenerComponent>
			</DefaultComponentCardOverlayBox>
		)
	}
	return null;

}
