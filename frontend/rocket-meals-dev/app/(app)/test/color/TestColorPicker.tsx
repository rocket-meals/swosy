import {Text, View} from '@/components/Themed';
import {Divider} from '@gluestack-ui/themed';
import {SimpleColorPicker} from "@/components/colorpicker/SimpleColorPicker";
import React, {useState} from "react";
import {MySafeAreaView} from "@/components/MySafeAreaView";

export default function HomeScreen() {

	const [color, setColor] = useState("#000000");

	return (
		<MySafeAreaView>
			<View>
				<Text>Selected color: {color}</Text>
				<Divider/>
				<View style={{
					width: 100,
					height: 100,
					backgroundColor: color,
				}} />
			</View>
			<SimpleColorPicker onColorChange={async (color) => {
				setColor(color);
			}}
			/>
		</MySafeAreaView>
	);
}
