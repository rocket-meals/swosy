import {DimensionValue, KeyboardAvoidingView, Platform, TouchableOpacity} from 'react-native';
import {useIsLargeDevice} from '@/helper/device/DeviceHelper';
import {useViewBackgroundColor, View} from '@/components/Themed';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ScrollViewWithGradient} from '@/components/scrollview/ScrollViewWithGradient';
import {ProjectBanner} from '@/components/project/ProjectBanner';
import {PublicLegalRequiredLinks} from '@/components/legal/PublicLegalRequiredLinks';
import {ProjectBackgroundImage} from '@/components/project/ProjectBackgroundImage';
import {MySafeAreaViewForScreensWithoutHeader} from '@/components/MySafeAreaViewForScreensWithoutHeader';
import {useMyContrastColor} from "@/helper/color/MyContrastColor";
import React from "react";
import {useDebug} from "@/states/Debug";

export type LoginLayoutProps = {
	children: React.ReactNode | React.ReactNode[]
}
export const LoginLayout = (props: any) => {
	/**
     breakpoints = {
     base: 0,
     sm: 480,
     md: 768,
     lg: 992,
     xl: 1280,
     };
     */

	const insets = useSafeAreaInsets();
	// StatusBar.currentHeight does not exist
	const paddingTop = insets.top;
	const keyboardVerticalOffset = paddingTop;
	const isSmallDevice = !useIsLargeDevice()

	function renderSpaceBetweenLogoAndSignIn() {
		return (
			<View style={{height: 12}}></View>
		)
	}


	function renderLeftSide() {
		const padding = isSmallDevice ? 20: 80;
		const width: DimensionValue = isSmallDevice ? '100%' : 500;

		const viewBackgroundColor = useViewBackgroundColor()
		const contrastBackgroundColor = useMyContrastColor(viewBackgroundColor)

		const [clickedBannerAmount, setClickedBannerAmount] = React.useState(0);
		const [debug, setDebug] = useDebug();


		const leftSizeContent = (
			<View style={{width: width, height: '100%'}}>
				<MySafeAreaViewForScreensWithoutHeader>
					<KeyboardAvoidingView
						keyboardVerticalOffset = {keyboardVerticalOffset} // adjust the value here if you need more padding
						style={{flexShrink: 1, width: '100%', height: '100%'}}
						behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
					>
						<ScrollViewWithGradient style={{flexShrink: 1}}>
							<View style={{width: '100%'}}>
								<View style={{
									position: 'absolute',
									width: '100%',
									height: '100%',
									backgroundColor: "transparent",
									paddingHorizontal: padding/2, paddingTop: padding/2,
								}}>
									<View style={{
										position: 'relative',
										width: '100%',
										height: '100%',
										backgroundColor: viewBackgroundColor,
										borderRadius: 10,

									}}>
									</View>
								</View>
								<View style={{paddingHorizontal: padding, paddingTop: padding, width: '100%'}}>
									<View
										style={{
											flexDirection: 'row',
											justifyContent: 'space-between',
										}}
									>
										<TouchableOpacity onPress={() => {
											if(clickedBannerAmount < 5) {
												setClickedBannerAmount(clickedBannerAmount + 1)
											} else {
												setClickedBannerAmount(0)
												setDebug(!debug)
											}
										}}>
											<ProjectBanner />
										</TouchableOpacity>
									</View>
									{renderSpaceBetweenLogoAndSignIn()}
									{props.children}
								</View>
							</View>
						</ScrollViewWithGradient>
					</KeyboardAvoidingView>
					<View style={{paddingHorizontal: padding, width: '100%', backgroundColor: viewBackgroundColor}}>
						<View
							style={{
								flexDirection: 'row',
								flexWrap: 'wrap',
							}}
						>
							<PublicLegalRequiredLinks />
							<View style={{
								width: '100%',
								height: 10,
							}}></View>
						</View>
					</View>
				</MySafeAreaViewForScreensWithoutHeader>
			</View>
		);

		let leftItem = leftSizeContent;

		if(isSmallDevice) {
			leftItem = <View style={{
				width: '100%',
				height: '100%',
			}}>
				<ProjectBackgroundImage />
				<View style={{
					position: 'absolute',
					width: '100%',
					height: '100%',
				}}>
					{leftSizeContent}
				</View>
			</View>
		}

		return leftItem;
	}

	function renderRightSide() {
		if (isSmallDevice) {
			return null;
		}

		return (
			<View style={{flex: 1}}>
				<ProjectBackgroundImage />
			</View>
		)
	}

	return (
		<View
			style={{height: '100%', width: '100%', flexDirection: 'row', flex: 1}}
		>
			{renderLeftSide()}
			{renderRightSide()}
		</View>
	)
}
