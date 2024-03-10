import {Icon, Text, View} from "@/components/Themed";
import {MyGridFlatList} from "@/components/grid/MyGridFlatList";
import {TranslationKeys, useTranslation, useTranslations} from "@/helper/translations/Translation";
import {IconNames} from "@/constants/IconNames";
import {Header} from "@react-navigation/elements";

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
            <Icon name={props.icon}/>
          </View>
          <View style={{ marginLeft: 4 }}>
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
  const [
    translation_calories,
    translation_protein,
    translation_fat,
    translation_carbohydrate,
    translation_fiber,
    translation_sugar,
    translation_sodium,
    translation_saturated_fat
  ] = useTranslations([
      TranslationKeys.nutritions_calories,
      TranslationKeys.nutritions_protein,
      TranslationKeys.nutritions_fat,
      TranslationKeys.nutritions_carbohydrate,
      TranslationKeys.nutritions_fiber,
      TranslationKeys.nutritions_sugar,
      TranslationKeys.nutritions_sodium,
      TranslationKeys.nutritions_saturated_fat
  ])

  const translation_disclaimer = useTranslation(TranslationKeys.nutritions_disclaimer);

  const data: {
    key: string;
    data: {icon: string, label: string, value?: number | null}
  }[] = [
    { key: "calories", data: {icon: IconNames.nutritions_calories_icon, label: translation_calories, value: props.calories_kcal} },
    { key: "carbohydrates", data: {icon: IconNames.nutritions_carbohydrate_icon, label: translation_carbohydrate, value: props.carbohydrate_g} },
    { key: "fiber", data: {icon: IconNames.nutritions_fiber_icon, label: translation_fiber, value: props.fiber_g} },
    { key: "protein", data: {icon: IconNames.protein_icon, label: translation_protein, value: props.protein_g} },
    { key: "sodium", data: {icon: IconNames.nutirtions_sodium_icom, label: translation_sodium, value: props.sodium_g} },
    { key: "fat", data: {icon: IconNames.nutritions_fat_icon, label: translation_fat, value: props.fat_g} },
    { key: "sugar", data: {icon: IconNames.nutritions_sugar_icon, label: translation_sugar, value: props.sugar_g} },
    { key: "saturatedFat", data: {icon: IconNames.nutritions_saturated_fat_icon, label: translation_saturated_fat, value: props.saturated_fat_g} },
  ]

  return (
    <View style={{ padding: 4 }}>
      <Header title={useTranslation(TranslationKeys.nutritions)}/>
      <MyGridFlatList gridAmount={2} data={data} renderItem={(item) => {
        return <NutritionListElement {...item.item.data}/>
      }}/>
      <Text>{translation_disclaimer}</Text>
    </View>
  )
}