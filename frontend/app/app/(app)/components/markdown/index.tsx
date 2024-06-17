import React from 'react';
import {MyScrollView} from '@/components/scrollview/MyScrollView';
import {MySafeAreaView} from '@/components/MySafeAreaView';
import {Text, useTextContrastColor, View} from "@/components/Themed";
import {realisticMarkdownPrivacyPolicy} from "@/app/(app)/test/markdown/test_markdown";
import {ThemedMarkdownWithCards} from "@/components/markdown/ThemedMarkdownWithCards";

export default function HomeScreen() {
	const textColor = useTextContrastColor();

	return (
		<MySafeAreaView>
			<MyScrollView>
				<ThemedMarkdownWithCards markdown={realisticMarkdownPrivacyPolicy} />
				<View style={{
					width: '100%',
					height: 2,
					backgroundColor: textColor
				}} />
				<View style={{
					width: '100%',
				}}>
					<Text>{realisticMarkdownPrivacyPolicy}</Text>
				</View>
			</MyScrollView>
		</MySafeAreaView>
	);
}
