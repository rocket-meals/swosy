import {useToast} from "@gluestack-ui/themed";
import {useViewBackgroundColor, View, Text} from "@/components/Themed";
import {useLighterOrDarkerColorForSelection, useMyContrastColor} from "@/helper/color/MyContrastColor";

export default function useMyToast(): {show: (message: string) => void} {
	const toast = useToast();

	const viewBackgroundColor = useViewBackgroundColor()
	const lighterOrDarkerBackgroundColor = useLighterOrDarkerColorForSelection(viewBackgroundColor)
	const lighterOrDarkerTextColor = useMyContrastColor(lighterOrDarkerBackgroundColor)

	const showToast = (message: string) => {
		toast.show({
			placement: "top",
			render: () => {
				return <View style={{
					backgroundColor: lighterOrDarkerBackgroundColor,
					padding: 10,
					borderRadius: 5,
					justifyContent: "center",
					alignItems: "center"
				}}>
					<Text style={{
						color: lighterOrDarkerTextColor
					}}>{message}</Text>
				</View>
			}
		});
	}

	return {
		show: showToast
	}
}