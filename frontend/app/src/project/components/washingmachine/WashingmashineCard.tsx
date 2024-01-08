import React, {FunctionComponent, useEffect} from "react";
import {useDebugMode, useDemoMode, useSynchedWashingmachine} from "../../helper/synchedJSONState";
import {ImageOverlayPosition, ImageOverlays} from "../imageOverlays/ImageOverlays";
import {ImageOverlay} from "../imageOverlays/ImageOverlay";
import {DefaultComponentCard} from "../detailsComponent/DefaultComponentCard";
import {Text, View} from "native-base";
import {WashingmachineAnimation} from "../animations/WashingmachineAnimation";
import {WashingmachineNotifyOverlay} from "./WashingmachineNotifyOverlay";
import {DateHelper} from "../../helper/DateHelper";


interface AppState {
	resource_id?: any,
	onPress?: (resourceId: string | number) => void,
	highlight?: boolean,
	small?: boolean,
	withoutOverlay?: boolean,
	index?: number
}
export const WashingmashineCard: FunctionComponent<AppState> = (props) => {

	const [demo, setDemo] = useDemoMode();

	const resource_id = props?.resource_id;
	const resource = useSynchedWashingmachine(resource_id);
	const resourceId = resource?.id;

	const isActive = false;

	const washingmachine = resource;

	const name = washingmachine?.name;
	//console.log(resource);
	let date_finished = washingmachine?.date_finished

	let dateInFuture = false;
	let minutes_remaining_readable = undefined;
	if(!!date_finished){
		let asDate = new Date(date_finished);
		dateInFuture = DateHelper.isDateInFuture(asDate);
		minutes_remaining_readable = DateHelper.formatDateToHHMM(new Date(asDate));
	}

	const running = dateInFuture;

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

		}
	}

	function renderOverlays(width){
		let output = [];


		if(running){
			if(!!minutes_remaining_readable){
				const renderedRemainingTime = <Text selectable={true}>{minutes_remaining_readable}</Text>
				output.push(<ImageOverlay image_overlay_id={"washingmachine_date_finished"} additionalContent={renderedRemainingTime} />);
			}
			if(!!date_finished){
				output.push(<WashingmachineNotifyOverlay width={width} position={ImageOverlayPosition.TOP_RIGHT} resource_id={resource_id} date_finished={date_finished} />)
			}
		}
		return output;
	}

	function renderTop(width){
		return(
			<View style={{ width: "100%", height: "100%" }}>
				<WashingmachineAnimation active={running} />
			</View>
		)
	}

	function renderTopForeground(width){
		return(
			<ImageOverlays width={width}>
				{renderOverlays(width)}
			</ImageOverlays>
		)
	}

	function renderBottom(backgroundColor, textColor){
		return <Text color={textColor} selectable={true} numberOfLines={3}>{name}</Text>
	}

	return(
		<DefaultComponentCard accessibilityLabel={name} small={small} onPressTop={onPress} renderTop={renderTop} renderTopForeground={renderTopForeground} renderBottom={renderBottom} liked={isActive} />
	)
}
