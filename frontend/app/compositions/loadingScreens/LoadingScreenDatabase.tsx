import React, {FunctionComponent} from 'react';
import {MySafeAreaView} from '@/components/MySafeAreaView';
import {Text, View} from '@/components/Themed';
import * as rocketSource from '@/assets/animations/rocket_purple.json';
import {MyProjectColoredLottieAnimation} from '@/components/lottie/MyProjectColoredLottieAnimation';
import {StringHelper} from '@/helper/string/StringHelper';
import {LoadingLogoProvider} from "@/compositions/loadingScreens/LoadingLogoProvider";
import {LoadingScreen, LoadingScreenTextInformationWrapper} from "@/compositions/loadingScreens/LoadingScreen";
import {useIsDebug} from "@/states/Debug";

interface AppState {
    children?: React.ReactNode;
    text: string,
    nowInMs: number
    synchedResources: {[key: string]: {data: any, lastUpdate: number | undefined}}
}
export const LoadingScreenDatabase: FunctionComponent<AppState> = ({children, nowInMs, synchedResources, ...props}) => {
	const isDebug = useIsDebug()

	const synchedResourcesDataSynchedDict: {[key: string]: any}
        = {}
	const synchedResourceKeys = Object.keys(synchedResources)
	let firstResourceKeyNotSynched = undefined
	let allResourcesSynched = true
	for (let i = 0; i < synchedResourceKeys.length; i++) {
		const synchedResourceKey = synchedResourceKeys[i]
		const synchedResourceInformation = synchedResources[synchedResourceKey]
		const synchedResource = synchedResourceInformation?.data
		const lastUpdate = synchedResourceInformation?.lastUpdate

		let isResourceSynched = false;
		if (lastUpdate != null) {
			isResourceSynched = !!synchedResource && !isNaN(lastUpdate) && lastUpdate === nowInMs
		} else {
			isResourceSynched = false
		}

		if (!isResourceSynched) {
			allResourcesSynched = false
		}

		if (!isResourceSynched && firstResourceKeyNotSynched == undefined) {
			firstResourceKeyNotSynched = synchedResourceKey
			break;
		}

		synchedResourcesDataSynchedDict[synchedResourceKey] = {
			data: !!synchedResource,
			lastUpdate: lastUpdate
		}
	}

	let content = null
	if (!allResourcesSynched) {
		content = (
			<>
				<Text>{'Loading resource:'}</Text>
				<Text>{firstResourceKeyNotSynched}</Text>
			</>
		)
	} else {
		content = (
			<>
				<Text>{'All resources loaded'}</Text>
				<Text>{StringHelper.EMPTY_SPACE}</Text>
			</>
		)
	}

	return (
		<LoadingScreen>
			<LoadingScreenTextInformationWrapper>
				<Text>{props.text}</Text>
				{isDebug && content}
				{isDebug && children}
			</LoadingScreenTextInformationWrapper>
		</LoadingScreen>
	);
}
