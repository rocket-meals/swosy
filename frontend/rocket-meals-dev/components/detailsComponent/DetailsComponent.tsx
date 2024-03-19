import React from 'react';
import {DimensionValue} from 'react-native';
import {useIsDebug} from "@/states/Debug";
import {Rectangle} from '@/components/shapes/Rectangle';
import ImageWithComponents from '@/components/project/ImageWithComponents';
import {Heading, Text, View} from '@/components/Themed';
import {useBreakPointValue} from "@/helper/device/DeviceHelper";
import {MyButton} from "@/components/buttons/MyButton";
import TabWrapper from "@/components/tab/TabWrapper";
import {DirectusImageProps} from "@/components/project/DirectusImage";
import {MyScrollView} from "@/components/scrollview/MyScrollView";


export type TabProps = {
	iconName: string;
	accessibilityLabel: string;
	text: string;
	content: React.ReactNode;
};

export function DetailsComponent({ heading, item, image, tabs, subHeadingComponent }: { subHeadingComponent?: React.ReactNode, heading: string |undefined |null, item: any, image: DirectusImageProps, tabs: TabProps[] }) {
	const isDebug = useIsDebug()

	const imageWidthPercentage = useBreakPointValue<DimensionValue | undefined>({
		sm: '100%',
		md: '100%',
		lg: '60%',
		xl: '40%',
	})

	type flexDirectionTypes = 'row' | 'column' | 'row-reverse' | 'column-reverse' | undefined;
	const showAsRowOrColumn = useBreakPointValue<flexDirectionTypes>({
		sm: 'column',
		md: 'column',
		lg: 'row',
		xl: 'row',
	})

	function renderTapHeader(active: boolean, setActive: () => void, leftRoundedBorder: boolean, rightRoundedBorder: boolean ,iconName: string, accessibilityLabel: string, text: string) {
		const leftBorderRadius = leftRoundedBorder ? undefined : 0;
		const rightBorderRadius = rightRoundedBorder ? undefined : 0;

		return (
			<View style={{width: '100%'}}><MyButton icon={iconName}
													centerItems={true}
													text={text}
													tooltip={text}
													accessibilityLabel={accessibilityLabel}
													isActive={active}
													onPress={() => {
														setActive();
													}}
													borderLeftRadius={leftBorderRadius}
													borderRightRadius={rightBorderRadius}
			/>
			</View>
		)
	}

	function renderTapHeaders(){
		let headers = []
		for(let i = 0; i < tabs.length; i++){
			headers.push((active: boolean, setActive: () => void) => renderTapHeader(active, setActive, i === 0, i === tabs.length - 1, tabs[i].iconName, tabs[i].accessibilityLabel, tabs[i].text))
		}
		if(isDebug){
			headers.push((active: boolean, setActive: () => void) => renderTapHeader(active, setActive, false, false, 'bug', 'Debug', 'Debug'))
		}
		return headers
	}

	function renderTabs(){
		let contents = []
		for(let i = 0; i < tabs.length; i++){
			let tab = tabs[i]

			let tabCopyWithoutContent = {...tab}
			delete tabCopyWithoutContent.content

			contents.push(<View style={{width: "100%"}}>
				<View style={{width: "100%", padding: 4, marginBottom: 8}}>
					<Heading style={{ textAlign: 'left'}}>{tab.text}</Heading>
				</View>
				{tab.content}
			</View>)
		}
		if(isDebug){
			contents.push(<View style={{width: "100%"}}>
				<Text>{JSON.stringify(item, null, 4)}</Text>
			</View>)
		}
		return contents
	}

	const MARGIN_HORIZONTAL = 10;

	return (
		<View style={{ padding: 0, width: '100%', height: '100%' }}>
			{(
				<MyScrollView>
					<View style={{width: '100%', flex: 1, flexDirection: showAsRowOrColumn}}>
						<View style={{width: imageWidthPercentage}}>
							<Rectangle>
								<ImageWithComponents
									image={image}
									innerPadding={0}
								/>
							</Rectangle>
						</View>

						<View style={{ flex: 1}}>
							<View style={{marginHorizontal: MARGIN_HORIZONTAL, marginVertical: 4, flexDirection: 'column', justifyContent: 'space-between'}}>
								<View style={{paddingBottom: 10}}>
									<Heading>
										{heading}
									</Heading>
								</View>
								{subHeadingComponent}
							</View>

							<View style={{ marginTop: 10, marginHorizontal: MARGIN_HORIZONTAL, flex: 1 }}>
								<TabWrapper headers={
									renderTapHeaders()
								}
								defaultActive={0}
								contents={
									renderTabs()
								}
								/>
							</View>
						</View>
					</View>
				</MyScrollView>
			)}
		</View>
	)
}