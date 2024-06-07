import React, {useState} from 'react';
import {MyScrollView} from '@/components/scrollview/MyScrollView';
import {MySafeAreaViewThemed} from '@/components/MySafeAreaViewThemed';
import {Heading, Text, Icon, IconFamily, IconParseDelimeter, View} from "@/components/Themed";
import DirectusImageOrIconComponent from "@/components/image/DirectusImageOrIconComponent";

export default function HomeScreen() {
	const [text, setText] = useState<string | undefined | null>('InitialText');
	const [active, setActive] = useState<boolean>(false);

	const switchActive = () => {
		setActive(!active);
	}

	const testIcons = [
		IconFamily.FontAwesome+IconParseDelimeter+'eye',
		IconFamily.Entypo+IconParseDelimeter+'eye',
	]

	let renderIcons = testIcons.map((icon, index) => {
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
	})

	return (
		<MySafeAreaViewThemed>
			<MyScrollView>
				<Heading>{"Gallery of all icons"}</Heading>
				{renderIcons}
			</MyScrollView>
		</MySafeAreaViewThemed>
	);
}
