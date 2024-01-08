// @ts-nocheck
import React from "react";
import {Layout} from "../../../kitcheningredients";
import {useBreakpointValue, View} from "native-base";
import timetable from "../../assets/timetable.json";
import Rectangle from "../../helper/Rectangle";
import {ProjectColoredCrossLottie} from "./ProjectColoredCrossLottie";

export const CourseTimetableAnimation = ({children,...props}: any) => {

	const noFoundWidths = {
		base: "70%",
		sm: "30%",
		md: Layout.WIDTH_MD*0.3,
		lg: Layout.WIDTH_LG*0.3,
		xl: Layout.WIDTH_XL*0.3
	}
	const noFoundWidth = useBreakpointValue(noFoundWidths);

	return (
		<View style={{width: "100%", alignItems: "center"}}>
			<View style={{width: noFoundWidth}}>
				<Rectangle aspectRatio={1}>
					<ProjectColoredCrossLottie source={timetable} flex={1} />
				</Rectangle>
			</View>
		</View>
	)
}
