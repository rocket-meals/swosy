import React, {FunctionComponent} from 'react';
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {View} from "@/components/Themed";
import {LoadingLogo} from "@/compositions/loadingScreens/LoadingLogo";

interface AppState {
	children?: React.ReactNode;
}
export const LoadingScreen: FunctionComponent<AppState> = ({children, ...props}) => {

	return <MySafeAreaView>
		<View style={{
			width: '100%',
			height: '100%',
			justifyContent: 'center',
			alignItems: 'center'
		}}
		>
			<LoadingLogo key={"loadingLogo"} />
			{children}
		</View>

	</MySafeAreaView>;
}
