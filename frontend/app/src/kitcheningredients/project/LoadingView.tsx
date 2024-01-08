// @ts-nocheck
import React, {FunctionComponent} from 'react';
import {Skeleton, View} from "native-base";
import {KitchenSkeleton} from "./KitchenSkeleton";

export const LoadingView: FunctionComponent = (props) => {
	const styles = {
		position: "absolute",
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
		opacity: 0.7,
		justifyContent: "center",
		alignItems: "center",
	}

	return (
		<KitchenSkeleton style={styles} />
	);
}
