import React, {FunctionComponent} from 'react';
import { useProjectPublicForegroundAssetId} from '@/states/ProjectInfo';
import DirectusImage from '@/components/project/DirectusImage';
import {ViewProps, ViewStyle} from 'react-native';
import {View} from '@/components/Themed';
import {ViewWithProjectColor} from '@/components/project/ViewWithProjectColor';

interface AppState {

}
export const ProjectBackgroundImage: FunctionComponent<AppState & ViewProps> = ({style, ...props}) => {
	const defaultStyle: ViewStyle = {width: '100%', height: '100%'}

	const directusImageAssetId = useProjectPublicForegroundAssetId()
	const fallbackElement = (
		<ViewWithProjectColor style={{width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center'}}>
		</ViewWithProjectColor>
	)
	//let fallbackElement = undefined

	return (
		<View style={[defaultStyle,style]} {...props}>
			<DirectusImage contentFit={'contain'} assetId={directusImageAssetId} fallbackElement={fallbackElement} style={[defaultStyle,style]} {...props}  />
		</View>
	)
}