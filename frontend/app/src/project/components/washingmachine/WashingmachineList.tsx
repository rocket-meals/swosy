import React, {FunctionComponent} from "react";
import {GridList} from "../GridList";
import {WashingmashineCard} from "./WashingmashineCard";

interface AppState {
	resource_ids: string[] | number[];
	onPress?: (resourceId: string | number) => void;
	withoutOverlay?: boolean;
}
export const WashingmachineList: FunctionComponent<AppState> = (props) => {

	let renderedCards = [];
	let index = 1;

	for(let resourceId of props?.resource_ids){
		renderedCards.push(<WashingmashineCard index={index} resource_id={resourceId} onPress={props?.onPress} withoutOverlay={props?.withoutOverlay} />)
		index++;
	}

	return(
		<GridList>
			{renderedCards}
		</GridList>
	)
}
