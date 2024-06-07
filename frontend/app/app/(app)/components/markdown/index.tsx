import React, {useState} from 'react';
import {MyScrollView} from '@/components/scrollview/MyScrollView';
import {MySafeAreaView} from '@/components/MySafeAreaView';
import {Heading, Text, Icon, IconFamily, IconParseDelimeter, View} from "@/components/Themed";
import DirectusImageOrIconComponent from "@/components/image/DirectusImageOrIconComponent";
import {ThemedMarkdown} from "@/components/markdown/ThemedMarkdown";
import {realisticMarkdownTest} from "@/app/(app)/test/markdown/test_markdown";
import {ThemedMarkdownWithCards} from "@/components/markdown/ThemedMarkdownWithCards";

export default function HomeScreen() {
	return (
		<MySafeAreaView>
			<MyScrollView>
				<ThemedMarkdownWithCards markdown={realisticMarkdownTest} />
			</MyScrollView>
		</MySafeAreaView>
	);
}
