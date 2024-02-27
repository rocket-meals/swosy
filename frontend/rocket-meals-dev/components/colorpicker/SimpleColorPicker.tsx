import React, {FunctionComponent} from 'react';
import {ListRenderItemInfo, View} from 'react-native';
import {ColorHelper} from "@/components/colorpicker/ColorHelper";
import {MyGridFlatList} from "@/components/grid/MyGridFlatList";
import {useBreakPointValue} from "@/helper/device/DeviceHelper";
import {ViewWithPercentageSupport} from "@/components/ViewWithPercentageSupport";
import {MyTouchableOpacity} from "@/components/buttons/MyTouchableOpacity";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";


const ColorPickItem: FunctionComponent<{color: string, onPress: (color: string) => void}> = (props) => {
	const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

	const translation_select = useTranslation(TranslationKeys.select)
	const translation_color = useTranslation(TranslationKeys.color)

	const color = props.color;

	const accessibilityLabel = translation_select + " " + translation_color + ": " + color;

	return <View style={{
		backgroundColor: "red",
		width: "100%",
		height: dimensions.width,
		alignItems: "center",
		justifyContent: "center",
	}}
		onLayout={event => {
			const { width, height } = event.nativeEvent.layout;
			setDimensions({ width, height });
		}}
	>
		<MyTouchableOpacity style={{width: "100%", height: "100%", alignItems: "center", justifyContent: "center"}} onPress={() => {
			props.onPress(color);
		}} accessibilityLabel={accessibilityLabel}>
			<ViewWithPercentageSupport style={{backgroundColor: color, borderColor: "black", borderWidth: 1, width: "100%", height: "100%"}} />
		</MyTouchableOpacity>
	</View>
}

interface SimpleColorPickerProps {
	onColorChange: (color: string) => void;
}
export const SimpleColorPicker: FunctionComponent<SimpleColorPickerProps> = (props) => {

	const amountColumns = useBreakPointValue({sm: 5, md: 6, lg: 7, xl: 16});

	async function onPress(color: string){
		if(props?.onColorChange){
			await props.onColorChange(color);
		}
	}

	const steps = 20;
	let colors = ColorHelper.getHueColors(steps)
	type DataItem = { key: string; data: string }

	let data: DataItem[] = []
	if(colors) {
		for (let i = 0; i < colors.length; i++) {
			const resource = colors[i];
			data.push({
				key: resource + "", data: resource
			})
		}
	}

	const renderItem = (info: ListRenderItemInfo<DataItem>) => {
		const {item, index} = info;
		const color = item.data;
		return <ColorPickItem color={color} onPress={onPress} />
	}

	return <MyGridFlatList data={data} renderItem={renderItem} gridAmount={amountColumns} />
}
