import React, {useState} from 'react';
import {MyScrollView} from '@/components/scrollview/MyScrollView';
import {MySafeAreaView} from '@/components/MySafeAreaView';
import {Heading, View, Text} from "@/components/Themed";
import {MyButton} from "@/components/buttons/MyButton";
import MyPrintComponent from "@/components/printComponent/MyPrintComponent";

export default function HomeScreen() {
	const [captureFunction, setCaptureFunction] = useState<() => void>();

	return (
		<MySafeAreaView>
			<MyScrollView>
				<Heading>{"Screenshot & Print"}</Heading>
				<MyButton
					text={"Print"}
					accessibilityLabel={"Print"}
					onPress={() => {
						console.log("Print");
						if (captureFunction) {
							console.log("captureFunction");
							console.log(captureFunction);
							captureFunction();
						}
					}}
				/>
				<MyPrintComponent setPrintCallback={setCaptureFunction}>
					<View style={{
						backgroundColor: 'red',
						width: 100,
						height: 100
					}}>
						<Text>{"Test"}</Text>
					</View>
				</MyPrintComponent>
			</MyScrollView>
		</MySafeAreaView>
	);
}
