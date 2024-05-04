import React from 'react';
import {View} from "@/components/Themed";
import {MyMap} from "@/app/(app)/map/MyMap";


export default function MapScreen() {

	return (
		<View style={{ flex: 1, width: "100%" }}>
			<MyMap />
		</View>
	);
}