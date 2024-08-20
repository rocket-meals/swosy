import React, {FunctionComponent} from 'react';
import {useProjectLogoAssetId} from '@/states/ProjectInfo';
import DirectusImage from '@/components/project/DirectusImage';
import {ViewProps} from 'react-native';
import {ProjectLogoDefault} from '@/components/project/ProjectLogoDefault';
import {View} from '@/components/Themed';
import {ViewWithProjectColor} from '@/components/project/ViewWithProjectColor';

export const ProjectLogoDefaultHeightAndWidth = 64;

interface AppState {
    rounded?: boolean
    size?: string
    titleBoxHeight?: number
	style?: ViewProps['style']
}
export const ProjectLogo: FunctionComponent<AppState & ViewProps> = ({style, ...props}) => {
	const defaultHeightAndWidth = ProjectLogoDefaultHeightAndWidth;
	const usedHeight: string | number = style?.height || defaultHeightAndWidth
	const usedWidth: string | number = style?.width || defaultHeightAndWidth
	const defaultStyle = {width: usedWidth, height: "100%"}

	const projectLogoAssetId = useProjectLogoAssetId()

	const fallbackElement = (
		<ViewWithProjectColor style={{width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center'}}>
			<ProjectLogoDefault style={{width: '80%', height: '80%'}} />
		</ViewWithProjectColor>
	)
	//let fallbackElement = undefined

	let borderRadius = ProjectLogoDefaultHeightAndWidth/6
	if(props.rounded===false){
		borderRadius = 0
	}
	if(typeof usedHeight === "number"){
		borderRadius = usedHeight/6
	}

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