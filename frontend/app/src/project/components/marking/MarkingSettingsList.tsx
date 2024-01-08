import React, {FunctionComponent} from "react";
import {MarkingSetting} from "./MarkingSetting";
import {NotFound} from "../animations/NotFound";
import {useSynchedMarkingsDict} from "../../helper/synchedJSONState";
import {Markings} from "../../directusTypes/types";
import {View, Text} from "native-base";

interface AppState {
	markings?: Markings[],
	header: any
}
export const MarkingSettingsList: FunctionComponent<AppState> = (props) => {

	const [allMarkingsDict, setAllMarkingsDict] = useSynchedMarkingsDict();
	const allMarkings: Markings[] = Object.values(allMarkingsDict);

	const markings = props?.markings;

	const usedMarkings = markings || allMarkings;

	function renderMarkings(){
		let rendered = [];
		if(allMarkingsDict===null){
			rendered.push(<NotFound />)
		} else if(usedMarkings===undefined){
			for(let i=0; i<30; i++){
				rendered.push(<MarkingSetting marking={null} key={null} />)
			}
		} else {
			for(let i=0; i<usedMarkings.length; i++){
				let marking = usedMarkings[i];
				rendered.push(<MarkingSetting marking={marking} key={marking.id+""} />)
			}
		}
		return rendered;
	}

	return(
		renderMarkings()
	)
}
