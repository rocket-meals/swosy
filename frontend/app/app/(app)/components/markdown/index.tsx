import React, {useState} from 'react';
import {MyScrollView} from '@/components/scrollview/MyScrollView';
import {MySafeAreaView} from '@/components/MySafeAreaView';
import {Heading, Text, Icon, IconFamily, IconParseDelimeter, View, useTextContrastColor} from "@/components/Themed";
import DirectusImageOrIconComponent from "@/components/image/DirectusImageOrIconComponent";
import {ThemedMarkdown} from "@/components/markdown/ThemedMarkdown";
import {realisticMarkdownTest, realisticMarkdownPrivacyPolicy, markdownWithDelimeters} from "@/app/(app)/test/markdown/test_markdown";
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
