import {useProjectColor} from '@/states/ProjectInfo';
import {useMyContrastColor} from '@/helper/color/MyContrastColor';
import {View, Text} from "@/components/Themed";

export type PricingBadgeProps = {
  price: number;
  color?: string;
}

export default function PricingBadge(props: PricingBadgeProps) {
	const projectColor = props.color ?? useProjectColor();
	const projectContrastColor = useMyContrastColor(projectColor);

	const priceContent =new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
		props.price,
	)


	return (
		<View style={{
			backgroundColor: projectColor,
			padding: 5,
			borderTopLeftRadius: 14,
			borderBottomLeftRadius: 14,
		}}
		>
			<Text style={{color: projectContrastColor}}>{priceContent}</Text>
		</View>
	)
}