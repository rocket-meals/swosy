import React, {useState} from 'react';
import {MyScrollView} from '@/components/scrollview/MyScrollView';
import {MySafeAreaViewThemed} from '@/components/MySafeAreaViewThemed';
import {Heading, Text, Icon, IconFamily, IconParseDelimeter, View} from "@/components/Themed";
import DirectusImageOrIconComponent from "@/components/image/DirectusImageOrIconComponent";
import {ThemedMarkdown} from "@/components/markdown/ThemedMarkdown";
import {realisticMarkdownTest} from "@/app/(app)/test/markdown/test_markdown";
import {ThemedMarkdownWithCards} from "@/components/markdown/ThemedMarkdownWithCards";

export default function HomeScreen() {
	return (
		<MySafeAreaViewThemed>
			<MyScrollView>
				<ThemedMarkdownWithCards markdown={realisticMarkdownTest} />
			</MyScrollView>
		</MySafeAreaViewThemed>
	);
}
