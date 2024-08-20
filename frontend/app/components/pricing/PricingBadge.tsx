import SimpleBadge from "@/components/badge/SimpleBadge";
import {NumberHelper} from "@/helper/number/NumberHelper";

export type PricingBadgeProps = {
  price: number;
  color?: string;
}

export function formatPrice(price: number | undefined | null): string {
	let currency = "€";
	return NumberHelper.formatNumber(price, currency, false, ",", ".", 2);
}

export default function PricingBadge(props: PricingBadgeProps) {
	const priceContent: string = formatPrice(props.price);

	return (
			<SimpleBadge borderBottomLeft={true} borderTopLeft={true} text={priceContent} color={props.color} />
	)
}