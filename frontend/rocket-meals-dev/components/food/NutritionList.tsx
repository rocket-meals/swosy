import {Icon, Text, View} from "@/components/Themed";

export type NutritionListProps = {
  calories_kcal?: number | null;
  carbohydrate_g?: number | null;
  fat_g?: number | null;
  fiber_g?: number | null;
  protein_g?: number | null;
  saturated_fat_g?: number | null;
  sodium_g?: number | null;
  sugar_g?: number | null;
}

export function NutritionListElement(props: {icon: string, label: string, value?: number | null}) {
    return (
        <View style={{ display: "flex", flexDirection: "row" }}>
          <View style={{ display: "flex", flexDirection: "column" }}>
            <Icon size={30} name={props.icon}/>
          </View>
          <View>
            <Text>
              {props.value ? props.value + "g" : "N/A"}
            </Text>
            <Text>
              {props.label}
            </Text>
          </View>
        </View>
    );
}

export default function NutritionList(props: NutritionListProps) {
  return (
    <View>
      <NutritionListElement icon={"fire"} label={"Calories"} value={props.calories_kcal}/>
      <NutritionListElement icon={"corn"} label={"Carbohydrates"} value={props.carbohydrate_g}/>
      <NutritionListElement icon={"water"} label={"Fat"} value={props.fat_g}/>
      <NutritionListElement icon={"leaf"} label={"Fiber"} value={props.fiber_g}/>
      <NutritionListElement icon={"fish"} label={"Protein"} value={props.protein_g}/>
      <NutritionListElement icon={"water-circle"} label={"Saturated Fat"} value={props.saturated_fat_g}/>
      <NutritionListElement icon={"grain"} label={"Sodium"} value={props.sodium_g}/>
      <NutritionListElement icon={"cupcake"} label={"Sugar"} value={props.sugar_g}/>
    </View>
  )
}