import {Text, TEXT_SIZE_3_EXTRA_LARGE, View} from "@/components/Themed";
import React from "react";
import {Canteens} from "@/helper/database/databaseTypes/types";
import {CompanyLogo} from "@/components/project/CompanyLogo";
import {getCanteenName} from "@/compositions/resourceGridList/canteenGridList";
import {HumanReadableTimeText} from "@/app/(app)/foodoffers/monitor/dayplan/details";

export const MonitorHeader = ({canteen, dateHumanReadable, rightContent}: {canteen: Canteens | null | undefined, dateHumanReadable: string, rightContent?: React.ReactNode}) => {
	//console.log(canteen)
	const canteen_name = getCanteenName(canteen);


	return(
		<View style={{
			width: '100%',
		}}>
			<View style={{
				width: '100%',
				flexDirection: "row",
			}}>
				<View style={{
					width: 200,
				}}>
					<CompanyLogo style={{
						height: '100%',
						width: '100%',
					}} />
				</View>
				<View style={{
					flex: 1,
					paddingHorizontal: 10,
					paddingVertical: 10,
				}}>
					<View>
						<Text bold={true} size={TEXT_SIZE_3_EXTRA_LARGE}>
							{canteen_name}
						</Text>
						<View style={{
							flexDirection: 'row',
							justifyContent: 'space-between',
							width: '100%',
						}}>
							<View>
								<Text bold={true}>
									{dateHumanReadable}{" - "}<HumanReadableTimeText bold={true} />
								</Text>
							</View>
							<View>
								{rightContent}
							</View>
						</View>
					</View>
				</View>
			</View>
		</View>
	)
}