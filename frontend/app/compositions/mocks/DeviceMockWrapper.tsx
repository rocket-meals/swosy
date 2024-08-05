import {FunctionComponent} from "react";
import {getFontSizeInPixelBySize, Icon, Text, TEXT_SIZE_SMALL, View} from "@/components/Themed";
import {DeviceMockType, useDeviceMockTypeState} from "@/states/DeviceMockState";
import {IconNames} from "@/constants/IconNames";
import {getIsLandScape} from "@/helper/device/DeviceHelper";


const getStatusBarHeightByDeviceMockType = (deviceMockType: DeviceMockType): number => {
	if (deviceMockType === 'iphone') {
		return 44;
	}
	if (deviceMockType === 'android') {
		return 0;
	}
	return 0;
}

const getStatusBarTimeByDeviceMockType = (deviceMockType: DeviceMockType): string => {
	if (deviceMockType === 'iphone') {
		return "9:41";
	}
	if (deviceMockType === 'android') {
		return "12:34";
	}
	return "12:34";
}

interface DeviceMockWrapperStatusBarProps {
	statusBarHeight: number;
	time: string;
}
export const DeviceMockWrapperStatusBar: FunctionComponent<DeviceMockWrapperStatusBarProps> = ({statusBarHeight, time, ...props}) => {
	const iconMargin = 5;

	return <View style={{
			width: "100%",
			height: statusBarHeight,
			flexDirection: "row",
			justifyContent: "center",
			alignItems: "center",
		}}>
			<View style={{
				paddingLeft: statusBarHeight/2,
				flex: 1,
				flexDirection: "row",
				alignItems: "center",
			}}>
				<Text size={TEXT_SIZE_SMALL}>
					{time}
				</Text>
			</View>
			<View style={{
				paddingRight: statusBarHeight/2,
				flex: 1,
				justifyContent: "flex-end",
				flexDirection: "row",
				alignItems: "center",
			}}>
				<Icon name={IconNames.phone_mock_iphone_signal_icon}
					  size={getFontSizeInPixelBySize(TEXT_SIZE_SMALL)}
					  style={{
						  margin: iconMargin,
					  }}
				/>
				<Icon name={IconNames.phone_mock_iphone_wifi_icon}
					  size={getFontSizeInPixelBySize(TEXT_SIZE_SMALL)}
					  style={{
						  margin: iconMargin,
					  }}
				/>
				<Icon name={IconNames.phone_mock_iphone_battery_full_icon}
					  size={getFontSizeInPixelBySize(TEXT_SIZE_SMALL)}
					  style={{
						  margin: iconMargin,
					  }}
				/>
			</View>
		</View>
}

interface AppState {
	children: any;
}
export const DeviceMockWrapper: FunctionComponent<AppState> = ({children, ...props}) => {

	let deviceMockState = useDeviceMockTypeState();
	deviceMockState = "iphone"

	const statusBarHeight = getStatusBarHeightByDeviceMockType(deviceMockState);
	let time = getStatusBarTimeByDeviceMockType(deviceMockState);
	const isLandscape = getIsLandScape();

	if(statusBarHeight === 0) {
		return children;
	}

	if(isLandscape) { // no status bar in landscape
		return children;
	}


	return <View style={{
		width: "100%",
		height: "100%",
		flex: 1,
		flexDirection: "column",
	}}>
		<DeviceMockWrapperStatusBar statusBarHeight={statusBarHeight} time={time}/>
		{children}
	</View>
}