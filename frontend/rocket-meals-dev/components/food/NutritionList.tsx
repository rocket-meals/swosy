import {Icon, Text, View} from "@/components/Themed";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {IconNames} from "@/constants/IconNames";

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

    const translation_calories = useTranslation(TranslationKeys.nutritions_calories);
    const translation_protein = useTranslation(TranslationKeys.nutritions_protein);
    const translation_fat = useTranslation(TranslationKeys.nutritions_fat);
    const translation_carbohydrate = useTranslation(TranslationKeys.nutritions_carbohydrate);
    const translation_fiber = useTranslation(TranslationKeys.nutritions_fiber);
    const translation_sugar = useTranslation(TranslationKeys.nutritions_sugar);
    const translation_sodium = useTranslation(TranslationKeys.nutritions_sodium);
    const translation_saturated_fat = useTranslation(TranslationKeys.nutritions_saturated_fat);

    const translation_disclaimer = useTranslation(TranslationKeys.nutritions_disclaimer);

  return (
    <View style={{
        width: "100%",
    }}>
        <View style={{
            width: "100%",
        }}>
            <NutritionListElement icon={IconNames.nutritions_calories_icon} label={translation_calories} value={props.calories_kcal}/>
            <View>
                <NutritionListElement icon={IconNames.nutritions_carbohydrate_icon} label={translation_carbohydrate} value={props.carbohydrate_g}/>
                <NutritionListElement icon={IconNames.nutritions_sugar_icon} label={translation_sugar} value={props.sugar_g}/>
            </View>
            <View>
                <NutritionListElement icon={IconNames.nutritions_fat_icon} label={translation_fat} value={props.fat_g}/>
                <NutritionListElement icon={IconNames.nutritions_saturated_fat_icon} label={translation_saturated_fat} value={props.saturated_fat_g}/>
            </View>
            <NutritionListElement icon={IconNames.nutritions_fiber_icon} label={translation_fiber} value={props.fiber_g}/>
            <NutritionListElement icon={IconNames.protein_icon} label={translation_protein} value={props.protein_g}/>
            <NutritionListElement icon={IconNames.nutirtions_sodium_icom} label={translation_sodium} value={props.sodium_g}/>
        </View>
        <Text>{translation_disclaimer}</Text>
    </View>
  )
}