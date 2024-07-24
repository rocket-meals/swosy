import React from 'react';
import {MyScrollView} from '@/components/scrollview/MyScrollView';
import {MySafeAreaView} from '@/components/MySafeAreaView';
import {Heading, Text, Icon, IconFamily, IconParseDelimeter, View} from "@/components/Themed";
import DirectusImageOrIconComponent from "@/components/image/DirectusImageOrIconComponent";

export default function HomeScreen() {
	const testIcons = [
		`${IconFamily.FontAwesome}${IconParseDelimeter}eye`,
		`${IconFamily.Entypo}${IconParseDelimeter}eye`,
	]

	return (
		<MySafeAreaView>
			<MyScrollView>
				<Heading>{"Gallery of all icons"}</Heading>
				{testIcons.map((icon, index) => {
					return <View style={{
						width: "100%", flexDirection: 'row', alignItems: 'center', paddingVertical: 10
					}}>
						<Text>
							{icon}
						</Text>
						<View style={{
							width: 10
						}} />
						<DirectusImageOrIconComponent resource={{
							icon: icon
						}} />
					</View>
				})}
			</MyScrollView>
		</MySafeAreaView>
	);
}
