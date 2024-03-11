import DirectusImage, {DirectusImageProps} from '@/components/project/DirectusImage';
import {View} from '@/components/Themed';
import {ReactNode} from 'react';

export type ImageWithComponentProps = {
  image: DirectusImageProps,
  bottomRightComponent?: ReactNode,
  topRightComponent?: ReactNode,
  bottomLeftComponent?: ReactNode,
  topLeftComponent?: ReactNode,
  innerPadding?: number,
}

export default function ImageWithComponents(props: ImageWithComponentProps) {
	const innerPadding = props.innerPadding ?? 10;

	return (
		<View style={{width: '100%', height: '100%'}}>
			<DirectusImage {...props.image} style={{width: '100%', height: '100%'}}/>
			<View style={{
				position: 'absolute',
				bottom: 0,
				right: 0,
				padding: innerPadding,
			}}
			>
				{props.bottomRightComponent}
			</View>
			<View style={{
				position: 'absolute',
				top: 0,
				right: 0,
				padding: innerPadding,
			}}
			>
				{props.topRightComponent}
			</View>
			<View style={{
				position: 'absolute',
				bottom: 0,
				left: 0,
				padding: innerPadding,
			}}
			>
				{props.bottomLeftComponent}
			</View>
			<View style={{
				position: 'absolute',
				top: 0,
				left: 0,
				padding: innerPadding,
			}}
			>
				{props.topLeftComponent}
			</View>
		</View>
	)
}