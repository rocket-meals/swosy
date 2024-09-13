import {Icon, Text, View} from '@/components/Themed';
import {MyGridFlatList} from '@/components/grid/MyGridFlatList';
import {TranslationKeys, useTranslation, useTranslations} from '@/helper/translations/Translation';
import {IconNames} from '@/constants/IconNames';
import {AppConfiguration} from "@/constants/AppConfiguration";
import {StringHelper} from "@/helper/string/StringHelper";
import {Foodoffers, Foods} from "@/helper/database/databaseTypes/types";
import {SettingsRowGroup} from "@/components/settings/SettingsRowGroup";
import {SettingsRow} from "@/components/settings/SettingsRow";
import {NumberHelper} from "@/helper/number/NumberHelper";

// Utility type to make properties optional if they are optional in either T or U
type MergeTypes<T1, T2> = T1 | T2;

type MakeOptional<T1, T2, K extends keyof T1 & keyof T2> =
	undefined extends T1[K]
		? MergeTypes<T1[K], T2[K]>
		: undefined extends T2[K]
			? MergeTypes<T1[K], T2[K]>
			: MergeTypes<T1[K], T2[K]>;

type CommonFieldsPreserveOptionality<T1, T2> = {
	[K in keyof T1 & keyof T2]?: MakeOptional<T1, T2, K>;
};


// Exported type with common fields between Foods and Foodoffers, preserving optionality
export type CommonFieldsOfFoodAndFoodoffers = CommonFieldsPreserveOptionality<Foods, Foodoffers>;

export type FoodInformationListProps = {
	columnAmount?: number;
  	data: CommonFieldsOfFoodAndFoodoffers,
}

export function foodInformationValueFound(value: string | number | null | undefined ): boolean {
	return value !== null && value !== undefined && value !== "";
}



export function formatFoodInformationElementValue(value:  string | number | null | undefined, unit: string | null | undefined): string | null {
	let valueWithUnit = "";
	const valueDataFound = foodInformationValueFound(value);
	if (valueDataFound) {
		if(typeof value === "number") {
			valueWithUnit = NumberHelper.formatNumber(value, unit, false, ",", ".", 1);
		} else {
			// value is found but not a number but a string
			// @ts-ignore
			valueWithUnit = ""+value.toString()
			if(unit !== null && unit !== undefined){
				valueWithUnit += StringHelper.NONBREAKING_HALF_SPACE+unit;
			}
		}
		return valueWithUnit;
	} else {
		return null;
	}
}

export function FoodInformationListElement(props: {renderedIcon: any, label: string, valueFormatted: string | null}) {
	if(props.valueFormatted === null) {
		return null;
	}

	let usedIcon = props.renderedIcon;

	const valueFormatted = props.valueFormatted;

	return (
		<View style={{ flex: 1, flexDirection: 'row', paddingBottom: 12 }}>
			<View style={{ flexDirection: 'column' }}>
				{usedIcon}
			</View>
			<View style={{ marginLeft: 4, flex: 1}}>
				<Text>
					{valueFormatted}
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

export class FoodInformationValueFormatter {
	static formatFoodInformationValueCalories(foodOrFoodOffer: CommonFieldsOfFoodAndFoodoffers): string | null {
		return formatFoodInformationElementValue(foodOrFoodOffer.calories_kcal, "kcal");
	}

	static formatFoodInformationValueCarbohydrates(foodOrFoodOffer: CommonFieldsOfFoodAndFoodoffers): string | null {
		return formatFoodInformationElementValue(foodOrFoodOffer.carbohydrate_g, "g");
	}

	static formatFoodInformationValueFiber(foodOrFoodOffer: CommonFieldsOfFoodAndFoodoffers): string | null {
		return formatFoodInformationElementValue(foodOrFoodOffer.fiber_g, "g");
	}

	static formatFoodInformationValueProtein(foodOrFoodOffer: CommonFieldsOfFoodAndFoodoffers): string | null {
		return formatFoodInformationElementValue(foodOrFoodOffer.protein_g, "g");
	}

	static formatFoodInformationValueSalt(foodOrFoodOffer: CommonFieldsOfFoodAndFoodoffers): string | null {
		return formatFoodInformationElementValue(foodOrFoodOffer.salt_g, "g");
	}

	static formatFoodInformationValueFat(foodOrFoodOffer: CommonFieldsOfFoodAndFoodoffers): string | null {
		return formatFoodInformationElementValue(foodOrFoodOffer.fat_g, "g");
	}

	static formatFoodInformationValueSugar(foodOrFoodOffer: CommonFieldsOfFoodAndFoodoffers): string | null {
		return formatFoodInformationElementValue(foodOrFoodOffer.sugar_g, "g");
	}

	static formatFoodInformationValueSaturatedFat(foodOrFoodOffer: CommonFieldsOfFoodAndFoodoffers): string | null {
		return formatFoodInformationElementValue(foodOrFoodOffer.saturated_fat_g, "g");
	}

	static formatFoodInformationValueCO2(foodOrFoodOffer: CommonFieldsOfFoodAndFoodoffers): string | null {
		return formatFoodInformationElementValue(foodOrFoodOffer.co2_g, "g");
	}
}

export function FoodDataList(props: FoodInformationListProps) {
	const [
		translation_calories,
		translation_protein,
		translation_fat,
		translation_carbohydrate,
		translation_fiber,
		translation_sugar,
		translation_salt,
		translation_saturated_fat,
	] = useTranslations([
		TranslationKeys.nutrition_calories,
		TranslationKeys.nutrition_protein,
		TranslationKeys.nutrition_fat,
		TranslationKeys.nutrition_carbohydrate,
		TranslationKeys.nutrition_fiber,
		TranslationKeys.nutrition_sugar,
		TranslationKeys.nutrition_salt,
		TranslationKeys.nutrition_saturated_fat
	])
	const translations_nutrition = useTranslation(TranslationKeys.nutrition);

	const [
		translation_environmental_impact_co2,
		translation_environmental_impact_co2_saving_percentage,
		translation_environmental_impact_co2_rating
	] = useTranslations([
		TranslationKeys.environmental_impact_co2,
		TranslationKeys.environmental_impact_co2_saving_percentage,
		TranslationKeys.environmental_impact_co2_rating,
	])
	const translation_environmental_impact = useTranslation(TranslationKeys.environmental_impact);

	const translation_no_value = useTranslation(TranslationKeys.no_value);

	type nutritionData = {
		icon: string,
		label: string,
		valueFormatted: string | null
	}

	const data_nutrition: {
    key: string;
    data: nutritionData
  }[] = [
  	{ key: 'calories', data: {icon: IconNames.nutrition_calories_icon, label: translation_calories, valueFormatted: FoodInformationValueFormatter.formatFoodInformationValueCalories(props.data)} },
  	{ key: 'carbohydrates', data: {icon: IconNames.nutrition_carbohydrate_icon, label: translation_carbohydrate, valueFormatted: FoodInformationValueFormatter.formatFoodInformationValueCarbohydrates(props.data)} },
  	{ key: 'fiber', data: {icon: IconNames.nutrition_fiber_icon, label: translation_fiber, valueFormatted: FoodInformationValueFormatter.formatFoodInformationValueFiber(props.data)} },
  	{ key: 'protein', data: {icon: IconNames.nutrition_protein_icon, label: translation_protein, valueFormatted: FoodInformationValueFormatter.formatFoodInformationValueProtein(props.data)} },
  	{ key: 'salt', data: {icon: IconNames.nutirtion_salt_icon, label: translation_salt, valueFormatted: FoodInformationValueFormatter.formatFoodInformationValueSalt(props.data)} },
  	{ key: 'fat', data: {icon: IconNames.nutrition_fat_icon, label: translation_fat, valueFormatted: FoodInformationValueFormatter.formatFoodInformationValueFat(props.data)} },
  	{ key: 'sugar', data: {icon: IconNames.nutrition_sugar_icon, label: translation_sugar, valueFormatted: FoodInformationValueFormatter.formatFoodInformationValueSugar(props.data)} },
  	{ key: 'saturatedFat', data: {icon: IconNames.nutrition_saturated_fat_icon, label: translation_saturated_fat, valueFormatted: FoodInformationValueFormatter.formatFoodInformationValueSaturatedFat(props.data)} },
  ]

	// filter nutrition data, remove all entries with no value
	const data_nutrition_filtered = data_nutrition.filter((element) => {
		return element.data.valueFormatted !== null;
	})
	const nutritionDataFound = data_nutrition_filtered.length > 0;


	const amountColumns = props.columnAmount || 2;

	let renderedNutritionInformation = null;
	if(nutritionDataFound) {
		renderedNutritionInformation = <SettingsRowGroup label={translations_nutrition}>
			<MyGridFlatList amountColumns={amountColumns}
							data={data_nutrition_filtered}
							renderItem={(item) => {
								let renderedIcon = <Icon name={item.item.data.icon}/>
								return <FoodInformationListElement renderedIcon={renderedIcon} {...item.item.data}/>
							}}
			/>
		</SettingsRowGroup>
	}


	const data_environmental_impact: {
		key: string;
		data: nutritionData
	}[] = [
		{ key: 'environmental_impact_co2', data: {icon: IconNames.environmental_impact_co2_icon, label: translation_environmental_impact_co2, valueFormatted: FoodInformationValueFormatter.formatFoodInformationValueCO2(props.data)} },
	]

	// filter environmental impact data, remove all entries with no value
	const data_environmental_impact_filtered = data_environmental_impact.filter((element) => {
		return element.data.valueFormatted !== null;
	})

	const environmentalImpactDataFound = data_environmental_impact_filtered.length > 0;

	let renderedEnvironmentalImpactInformation = null;
	if(environmentalImpactDataFound) {
		renderedEnvironmentalImpactInformation = <SettingsRowGroup label={translation_environmental_impact}>
			<MyGridFlatList amountColumns={amountColumns}
							data={data_environmental_impact_filtered}
							renderItem={(item) => {
								let renderedIcon = <Icon name={item.item.data.icon}/>
								return <FoodInformationListElement renderedIcon={renderedIcon} {...item.item.data}/>
							}}
			/>
		</SettingsRowGroup>
	}

	return (
		<View style={{
			width: "100%",
		}}>
			{renderedNutritionInformation}
			{renderedEnvironmentalImpactInformation}
		</View>
	)
}