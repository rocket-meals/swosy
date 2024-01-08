import React, {FunctionComponent, useEffect} from "react";
import {Text} from "native-base";
import {CanteenImage} from "./CanteenImage";
import {DefaultComponentCard} from "../detailsComponent/DefaultComponentCard";
import {useSynchedBuilding, useSynchedBuildingsDict, useSynchedCanteen} from "../../helper/synchedJSONState";
import {BuildingsCardOverlayDistance} from "../buildings/BuildingsCardOverlayDistance";
import {CanteenCardOverlayMoreInformation} from "./CanteenCardOverlayMoreInformation";

export function useSynchedCanteenBuilding(resource_id: number | string): any {
	const resource = useSynchedCanteen(resource_id);
	const buildingResourceId = resource?.building;
	const canteenBuilding = useSynchedBuilding(buildingResourceId);
	return canteenBuilding;
}

export class CanteenHelper{
	static getBusinesshoursIds(resource_id: number | string): number[] {
		const resource = useSynchedCanteen(resource_id);
		const businesshourIds = [];
		const businesshoursRelations = resource?.businesshours;
		if(businesshoursRelations){
			for(let i = 0; i < businesshoursRelations?.length; i++){
				const businesshourRelation = businesshoursRelations[i];
				const businesshourId = businesshourRelation?.businesshours_id;
				businesshourIds.push(businesshourId);
			}
		}
		return businesshourIds;
	}
}
