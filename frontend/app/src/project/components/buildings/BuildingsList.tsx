import React, {FunctionComponent} from "react";
import {GridList} from "../../components/GridList";
import {BuildingsCard} from "../../components/buildings/BuildingsCard";

interface AppState {
	resource_ids: string[] | number[];
	withoutOverlay?: boolean;
	onPress?: (resource_id: string | number) => void;
}
export const BuildingsList: FunctionComponent<AppState> = (props) => {

	let output = [];
	for(let resourceId of props?.resource_ids || []){
		output.push(<BuildingsCard key={resourceId} resource_id={resourceId} small={true} withoutOverlay={props?.withoutOverlay} onPress={props?.onPress} />)
	}
	return (
		<GridList
			paddingHorizontal={"2%"}
			paddingVertical={"2%"}
			style={{flex: 1}} >
			{output}
		</GridList>
	);
}
