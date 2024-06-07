import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {DimensionValue, KeyboardAvoidingView, Platform} from 'react-native';
import {useIsLargeDevice} from '@/helper/device/DeviceHelper';
import {Text, useViewBackgroundColor, View} from '@/components/Themed';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ScrollViewWithGradient} from '@/components/scrollview/ScrollViewWithGradient';
import {ProjectBanner} from '@/components/project/ProjectBanner';
import {LegalRequiredLinks} from '@/components/legal/LegalRequiredLinks';
import {ProjectBackgroundImage} from '@/components/project/ProjectBackgroundImage';
import {MySafeAreaViewThemedForScreensWithoutHeader} from '@/components/MySafeAreaViewThemedForScreensWithoutHeader';
import {useMyContrastColor} from "@/helper/color/MyContrastColor";

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

	const translation_by_continuing_you_agree_to_terms_and_conditions_and_privacy_policy = useTranslation(TranslationKeys.by_continuing_you_agree_to_terms_and_conditions_and_privacy_policy);

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

	function renderConsentTermsOfUseAndPrivacyPolicy() {
		return (
			<View style={{
				width: '100%',
				flexDirection: 'row',
				flexWrap: 'wrap',
				justifyContent: 'center',
				alignItems: 'center'
			}}
			>
				<Text style={{
					fontSize: 12,
					textAlign: 'center',
					width: '100%' // Add this line to ensure full width
				}}
				>
					{translation_by_continuing_you_agree_to_terms_and_conditions_and_privacy_policy}
				</Text>
			</View>
		)
	}

	function renderLeftSide() {
		const padding = isSmallDevice ? 20: 80;
		const width: DimensionValue = isSmallDevice ? '100%' : 500;

		const viewBackgroundColor = useViewBackgroundColor()
		const contrastBackgroundColor = useMyContrastColor(viewBackgroundColor)

		const leftSizeContent = (
			<View style={{width: width, height: '100%'}}>
				<MySafeAreaViewThemedForScreensWithoutHeader>
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
										<ProjectBanner />
									</View>
									{renderSpaceBetweenLogoAndSignIn()}
									{props.children}
								</View>
							</View>
						</ScrollViewWithGradient>
					</KeyboardAvoidingView>
					<View style={{paddingHorizontal: padding, width: '100%', backgroundColor: viewBackgroundColor}}>
						{renderConsentTermsOfUseAndPrivacyPolicy()}
						<View
							style={{
								flexDirection: 'row',
								flexWrap: 'wrap',
							}}
						>
							<LegalRequiredLinks />
						</View>
					</View>
				</MySafeAreaViewThemedForScreensWithoutHeader>
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
