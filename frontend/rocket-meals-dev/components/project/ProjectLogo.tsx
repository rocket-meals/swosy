import React, {FunctionComponent} from 'react';
import {useProjectLogoAssetId} from '@/states/ProjectInfo';
import DirectusImage from '@/components/project/DirectusImage';
import {ViewProps} from 'react-native';
import {ProjectLogoDefault} from '@/components/project/ProjectLogoDefault';
import {View} from '@/components/Themed';
import {ViewWithProjectColor} from '@/components/project/ViewWithProjectColor';

interface AppState {
    rounded?: boolean
    size?: string
    titleBoxHeight?: number
}
export const ProjectLogo: FunctionComponent<AppState & ViewProps> = ({style, ...props}) => {
	const defaultHeightAndWidth = 64;
	const defaultStyle = {width: defaultHeightAndWidth, height: defaultHeightAndWidth}

	const projectLogoAssetId = useProjectLogoAssetId()
	const fallbackElement = (
		<ViewWithProjectColor style={{width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center'}}>
			<ProjectLogoDefault style={{width: '80%', height: '80%'}} />
		</ViewWithProjectColor>
	)
	//let fallbackElement = undefined

	return (
		<View style={{height: defaultHeightAndWidth, width: defaultHeightAndWidth, borderRadius: defaultHeightAndWidth/6, alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
			<DirectusImage assetId={projectLogoAssetId} fallbackElement={fallbackElement} style={[defaultStyle,style]} {...props}  />
		</View>
	)
}