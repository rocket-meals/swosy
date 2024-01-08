import React, {FunctionComponent} from "react";
import {DefaultComponentCardOverlayBox} from "../detailsComponent/DefaultComponentCardOverlayBox";
import {ImageOverlayPosition} from "../imageOverlays/ImageOverlays";
import {NotificationItem} from "../notification/NotificationItem";
import {useSynchedWashingmachine} from "../../helper/synchedJSONState";
import {DateHelper} from "../../helper/DateHelper";
import {ImageOverlayPaddingStyle} from "../imageOverlays/ImageOverlay";

interface AppState {
	position?: ImageOverlayPosition,
	width?: number,
	resource_id?: any,
	date_finished: Date
}
export const WashingmachineNotifyOverlay: FunctionComponent<AppState> = (props) => {

	const width = props?.width;

	const resource_id = props?.resource_id;

	const resource = useSynchedWashingmachine(resource_id);
	const washingmachine = resource;
	const name = washingmachine?.name;

	const position = props?.position;

	async function getNotificationMessageObject() {
		const secondsFromNow = DateHelper.getSecondsToDate(props.date_finished);

		return {
			title: "Washingmachine finished",
			body: name + " finished",
			secondsFromNow: secondsFromNow
		}
	}

	return <DefaultComponentCardOverlayBox width={width} position={position} withouthPadding={true}>
			<NotificationItem
				style={{...ImageOverlayPaddingStyle}}
				accountRequired={false} localNotificationEnabledNative={true} localNotificationEnabledWeb={true} localNotificationKey={"WashingMachine"+resource_id} getNotificationMessageObject={getNotificationMessageObject.bind(null)} >
			</NotificationItem>
		</DefaultComponentCardOverlayBox>


}
