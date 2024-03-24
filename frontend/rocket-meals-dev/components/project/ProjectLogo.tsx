import React, {FunctionComponent} from 'react';
import {useProjectLogoAssetId} from '@/states/ProjectInfo';
import DirectusImage from '@/components/project/DirectusImage';
import {ViewProps} from 'react-native';
import {ProjectLogoDefault} from '@/components/project/ProjectLogoDefault';
import {View, Text} from '@/components/Themed';
import {ViewWithProjectColor} from '@/components/project/ViewWithProjectColor';

interface AppState {
    rounded?: boolean
    size?: string
    titleBoxHeight?: number
	style?: ViewProps['style']
}
export const ProjectLogo: FunctionComponent<AppState & ViewProps> = ({style, ...props}) => {
	const defaultHeightAndWidth = 64;
	const usedHeight = style?.height || defaultHeightAndWidth
	const usedWidth = style?.width || defaultHeightAndWidth
	const defaultStyle = {width: usedWidth, height: "100%"}

	const projectLogoAssetId = useProjectLogoAssetId()
	const fallbackElement = (
		<ViewWithProjectColor style={{width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center'}}>
			<ProjectLogoDefault style={{width: '80%', height: '80%'}} />
		</ViewWithProjectColor>
	)
	//let fallbackElement = undefined

	let borderRadius = usedHeight/6

	return (
		<View key={projectLogoAssetId} style={{height: usedHeight, width: usedWidth, borderRadius: borderRadius, alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
			<DirectusImage key={projectLogoAssetId} contentFit={
				'contain'
			} assetId={projectLogoAssetId} fallbackElement={fallbackElement} style={{
				position: 'relative',
				width: '100%',
				height: '100%',
			}} {...props}  />
		</View>
	)
}