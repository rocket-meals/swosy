import React, {FunctionComponent, useEffect} from "react";
import {useDebugMode, useDemoMode, useSynchedWashingmachine} from "../../helper/synchedJSONState";
import {ImageOverlayPosition, ImageOverlays} from "../imageOverlays/ImageOverlays";
import {ImageOverlay} from "../imageOverlays/ImageOverlay";
import {DefaultComponentCard} from "../detailsComponent/DefaultComponentCard";
import {Text, View} from "native-base";
import {WashingmachineAnimation} from "../animations/WashingmachineAnimation";
import {WashingmachineNotifyOverlay} from "./WashingmachineNotifyOverlay";
import {DateHelper} from "../../helper/DateHelper";

export class WashingmashineHelper{

	static getDemoWashingmachineIdList(){
		let keys = Object.keys(WashingmashineHelper.getDemoWashingmachineDict());
		return keys;
	}

	static getDemoWashingmachineDict(){
		let dict = {};
		for(let i=1; i<=4; i++){
			dict[i+""] = WashingmashineHelper.getDemoMachine(i);
		}
		return dict;
	}

	private static getDemoMachine(id){
		let names = ["Demo WM", "Demo TR"];
		let name = names[id%names.length]+((parseInt((id-1)/names.length+"")+1));

		let minutes = id%3==0 ? 0 : 1+id*1;
		let date_finished = DateHelper.getCurrentDateInMinutes(minutes);

		return {
			id: id,
			name: name,
			date_finished: date_finished
		}
	}

}
