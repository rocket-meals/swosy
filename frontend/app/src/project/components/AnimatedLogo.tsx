import {useColorMode, View} from "native-base";
import {CrossLottie, ServerAPI} from "../../kitcheningredients";
import rocketWhite from "../assets/rocket-white.json"
import Rectangle from "../helper/Rectangle";
import {ServerInfoHelper} from "../../kitcheningredients/helper/ServerInfoHelper";
import {ViewPercentageBorderradius} from "../helper/ViewPercentageBorderradius";
import React from "react";
import {ProjectColoredCrossLottie} from "./animations/ProjectColoredCrossLottie";

export const AnimatedLogo = (props) => {

	let serverInfo = ServerAPI.tempStore.serverInfo
	let color = ServerInfoHelper.getProjectColor(serverInfo);

	const { colorMode, toggleColorMode } = useColorMode();
	let source=rocketWhite

	return(
			<ViewPercentageBorderradius style={{width: "100%", borderRadius: "5%", backgroundColor: color, padding: "10%", marginBottom: "10%"}}>
				<Rectangle>
					<View style={{width: "100%", height: "100%", justifyContent: "center", alignItems: "center"}}>
						<View style={{width: "100%"}}>
							<View style={{marginBottom: "10%"}}>
								<Rectangle>
									<ProjectColoredCrossLottie key={colorMode} source={source} flex={1} />
								</Rectangle>
							</View>
						</View>
					</View>
				</Rectangle>
			</ViewPercentageBorderradius>
	)
}
