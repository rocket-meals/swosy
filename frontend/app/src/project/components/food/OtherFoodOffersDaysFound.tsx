import React, {useEffect, useState} from "react";
import {useBreakpointValue, View, Text} from "native-base";
import {OtherFoodOffersDaysFoundComponent} from "./OtherFoodOffersDaysFoundComponent";
import {ParentSpacer} from "../../helper/ParentSpacer";
import {useSynchedProfile, useSynchedProfileCanteen} from "../profile/ProfileAPI";

export const OtherFoodOffersDaysFound = (props: any) => {

	const [profileCanteenId, setProfileCanteenId] = useSynchedProfileCanteen();

	useEffect(() => {

	}, [props])

	return (
		<View style={{width: "100%", alignItems: "center"}}>
				<ParentSpacer space={10} style={{width: "100%", flex: 1, flexDirection: "row"}}>
					<View style={{ width: "100%",flex: 1}}>
						<OtherFoodOffersDaysFoundComponent canteenId={profileCanteenId} amountDays={-7} />
					</View>
					<View style={{ width: "100%",flex: 1}}>
						<OtherFoodOffersDaysFoundComponent canteenId={profileCanteenId} amountDays={7} />
					</View>
				</ParentSpacer>
		</View>
	)
}
