import React, {useEffect, useState} from "react";
import {useSynchedBuilding, useSynchedBuildingsDict} from "../../helper/synchedJSONState";
import {BuildingsImage} from "../buildings/BuildingsImage";

export const CanteenImage = ({canteen ,...props}: any) => {

	const buildingResourceId = canteen?.building;
	const canteenBuilding = useSynchedBuilding(buildingResourceId);

	return (
		<BuildingsImage resource={canteenBuilding} >
			{props?.children}
		</BuildingsImage>
	)
}
