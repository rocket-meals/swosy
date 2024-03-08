import {StyleProp, ViewStyle} from "react-native";
import {Button, Divider, Text, View} from "@gluestack-ui/themed";
import {useProjectColor} from "@/states/ProjectInfo";
import {useTextContrastColor} from "@/components/Themed";
import {useMyContrastColor} from "@/helper/color/MyContrastColor";

export type PricingBadgeProps = {
  price: number;
  currency: string;
}

export default function PricingBadge(props: PricingBadgeProps) {
  const projectColor = useProjectColor();
  const projectContrastColor = useMyContrastColor(projectColor);

  const priceContent =new Intl.NumberFormat('de-DE', { style: 'currency', currency: "EUR" }).format(
      props.price,
  )


      return (
      <View style={{
        backgroundColor: projectColor,
        padding: 5,
        borderTopLeftRadius: 5,
      }}>
        <Text color={projectContrastColor}>{priceContent}</Text>
      </View>
  )
}