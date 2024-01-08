import React from "react";
import {useSynchedCanteensDict} from "../../helper/synchedJSONState";
import {CanteenList} from "./CanteenList";

export const CanteenListAll = ({onPress, ...props}: any) => {

	const [canteensDict, setCanteensDict] = useSynchedCanteensDict();
	const canteen_ids = canteensDict ? Object.keys(canteensDict) : undefined;

	return(
		<CanteenList resource_ids={canteen_ids} onPress={onPress} />
	)
}
