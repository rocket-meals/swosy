import React, {useState} from 'react';
import {MyScrollView} from '@/components/scrollview/MyScrollView';
import {MySafeAreaView} from '@/components/MySafeAreaView';
import {Heading, Text, Icon, IconFamily, IconParseDelimeter, View} from "@/components/Themed";
import DirectusImageOrIconComponent from "@/components/image/DirectusImageOrIconComponent";
import DirectusImage from "@/components/project/DirectusImage";
import {RectangleWithLayoutCharactersWide} from "@/components/shapes/Rectangle";

export default function HomeScreen() {

	let asset_large_example_image = "d44c11a0-2dd0-46a1-838d-55c85f6bc64a";

	return (
		<MySafeAreaView>
			<MyScrollView>
				<Heading>{"Directus Image"}</Heading>
				<View style={{
					backgroundColor: "red",
					width: "100%"
				}}>
					<RectangleWithLayoutCharactersWide amountOfCharactersWide={40} >
						<View style={{
							width: "100%",
							height: "100%",
							backgroundColor: "green"
						}}>
							<DirectusImage assetId={asset_large_example_image} style={{
								width: "100%",
								height: "100%"
							}} />
						</View>
					</RectangleWithLayoutCharactersWide>
				</View>
			</MyScrollView>
		</MySafeAreaView>
	);
}
