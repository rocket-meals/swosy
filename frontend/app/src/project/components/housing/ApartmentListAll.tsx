import React from "react";
import {useSynchedApartmentsDict, useSynchedCanteensDict} from "../../helper/synchedJSONState";
import {ApartmentList} from "./ApartmentList";

export const ApartmentListAll = ({onPress, ...props}: any) => {

	const [resourceDict, setResourcesDict] = useSynchedApartmentsDict();
	const resource_ids = resourceDict ? Object.keys(resourceDict) : undefined;

	return(
		<ApartmentList resource_ids={resource_ids} onPress={onPress} />
	)
}
