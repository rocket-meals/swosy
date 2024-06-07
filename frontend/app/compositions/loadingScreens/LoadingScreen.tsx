import React, {FunctionComponent} from 'react';
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {useViewBackgroundColor, View, Text} from "@/components/Themed";
import {LoadingLogoProvider, useLoadingLogo} from "@/compositions/loadingScreens/LoadingLogoProvider";
import {useDebug} from "@/states/Debug";
import {MyTouchableOpacity} from "@/components/buttons/MyTouchableOpacity";
import {MyScrollView} from "@/components/scrollview/MyScrollView";

interface LoadingScreenFullScreenOverlayProps {
	children?: React.ReactNode;
}

export const LoadingScreenFullScreenOverlay: FunctionComponent<LoadingScreenFullScreenOverlayProps> = ({children, ...props}) => {
	const viewBackgroundColor = useViewBackgroundColor()

	return <View style={{
		position: 'absolute',
		top: 0,
		left: 0,
		width: '100%',
		height: '100%',
		backgroundColor: viewBackgroundColor,
		justifyContent: 'center',
		alignItems: 'center'
	}}>
		{children}
	</View>
}


interface LoadingScreenTextProps {
	children?: React.ReactNode;
	text?: string;
}
export const LoadingScreenTextInformationWrapper: FunctionComponent<LoadingScreenTextProps> = ({children, ...props}) => {
	const viewBackgroundColor = useViewBackgroundColor()

	return (
		<View style={{
			position: 'absolute',
			bottom: 0,
			left: 0,
			width: '100%',
			justifyContent: "flex-end"
		}}>
			<MyScrollView>
				<View style={{
					backgroundColor: viewBackgroundColor,
					justifyContent: 'center',
					alignItems: 'center',
					padding: 20
				}}>
					{children}
				</View>
			</MyScrollView>
		</View>
	)
}

interface AppState {
	children?: React.ReactNode;
}
export const LoadingScreen: FunctionComponent<AppState> = ({children, ...props}) => {

	const viewBackgroundColor = useViewBackgroundColor()
	const [debug, setDebug] = useDebug()
	const [logoPressCount, setLogoPressCount] = React.useState<number>(0)
	const logo = useLoadingLogo();

	function renderDebugSwitch(){
		return(
			<View style={{
				position: 'absolute',
				top: 0,
				left: 0,
			}}
				  accessible={false} accessibilityElementsHidden={true}
			>
				<MyTouchableOpacity style={{
					backgroundColor: debug ? 'green' : 'transparent',
					height: 50,
					width: 50
				}} accessibilityLabel={'Debug'} onPress={() => {
					// if the user presses the logo 5 times, we show the debug information
					const newCount = logoPressCount + 1
					setLogoPressCount(newCount)
					if(newCount >= 5) {
						setDebug(!debug)
						setLogoPressCount(0)
					}
				} } />
			</View>
		)
	}

	return <MySafeAreaView>
		<View style={{
			width: '100%',
			height: '100%',
			justifyContent: 'center',
			alignItems: 'center'
		}}
		>
			{logo}
		</View>
		{children}
		{renderDebugSwitch()}
	</MySafeAreaView>;
}
