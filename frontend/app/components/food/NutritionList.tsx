import {Icon, Text, View} from '@/components/Themed';
import {MyGridFlatList} from '@/components/grid/MyGridFlatList';
import {TranslationKeys, useTranslation, useTranslations} from '@/helper/translations/Translation';
import {IconNames} from '@/constants/IconNames';
import {AppConfiguration} from "@/constants/AppConfiguration";

export type NutritionDataProps = {
	protein_g?: number | null | undefined ,
	fat_g?: number | null | undefined ,
	carbohydrate_g?: number | null | undefined ,
	fiber_g?: number | null | undefined ,
	sugar_g?: number | null | undefined ,
	sodium_g?: number | null | undefined ,
	calories_kcal?: number | null | undefined ,
	saturated_fat_g?: number | null | undefined
}
export type NutritionListProps = {
	columnAmount?: number;
  	data: NutritionDataProps;
}

export function NutritionListElement(props: {renderedIcon: any, label: string, value?: number | null, unit?: string | null}) {
	const translation_no_value = useTranslation(TranslationKeys.no_value);

	let usedIcon = props.renderedIcon;
	if(!AppConfiguration.DEFAULT_FOOD_NUTRITION_ICON_SHOW){
		usedIcon = null;
	}

	return (
		<View style={{ flex: 1, flexDirection: 'row', paddingBottom: 12 }}>
			<View style={{ flexDirection: 'column' }}>
				{usedIcon}
			</View>
			<View style={{ marginLeft: 4, flex: 1}}>
				<Text>
					{props.value ? ""+props.value + props.unit : translation_no_value}
				</Text>
				<View style={{
					flex: 1
				}}>
					<Text>
						{props.label}
					</Text>
				</View>
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
		TranslationKeys.nutrition_calories,
		TranslationKeys.nutrition_protein,
		TranslationKeys.nutrition_fat,
		TranslationKeys.nutrition_carbohydrate,
		TranslationKeys.nutrition_fiber,
		TranslationKeys.nutrition_sugar,
		TranslationKeys.nutrition_sodium,
		TranslationKeys.nutrition_saturated_fat
	])

	const data: {
    key: string;
    data: {icon: string, label: string, value?: number | null, unit?: string}
  }[] = [
  	{ key: 'calories', data: {icon: IconNames.nutrition_calories_icon, label: translation_calories, value: props.data.calories_kcal, unit: "kcal"} },
  	{ key: 'carbohydrates', data: {icon: IconNames.nutrition_carbohydrate_icon, label: translation_carbohydrate, value: props.data.carbohydrate_g, unit: "g"} },
  	{ key: 'fiber', data: {icon: IconNames.nutrition_fiber_icon, label: translation_fiber, value: props.data.fiber_g, unit: "g"} },
  	{ key: 'protein', data: {icon: IconNames.nutrition_protein_icon, label: translation_protein, value: props.data.protein_g, unit: "g"} },
  	{ key: 'sodium', data: {icon: IconNames.nutirtion_sodium_icon, label: translation_sodium, value: props.data.sodium_g, unit: "g"} },
  	{ key: 'fat', data: {icon: IconNames.nutrition_fat_icon, label: translation_fat, value: props.data.fat_g, unit: "g"} },
  	{ key: 'sugar', data: {icon: IconNames.nutrition_sugar_icon, label: translation_sugar, value: props.data.sugar_g, unit: "g"} },
  	{ key: 'saturatedFat', data: {icon: IconNames.nutrition_saturated_fat_icon, label: translation_saturated_fat, value: props.data.saturated_fat_g, unit: "g"} },
  ]

	const amountColumns = props.columnAmount || 2;

	return (
		<View style={{
			width: "100%",
		}}>
			<MyGridFlatList amountColumns={amountColumns}
				data={data}
				renderItem={(item) => {
					let renderedIcon = <Icon name={item.item.data.icon}/>
					return <NutritionListElement renderedIcon={renderedIcon} {...item.item.data}/>
				}}
			/>
		</View>
	)
}