import {Icon, Text, View} from '@/components/Themed';
import {MyGridFlatList} from '@/components/grid/MyGridFlatList';
import {TranslationKeys, useTranslation, useTranslations} from '@/helper/translations/Translation';
import {IconNames} from '@/constants/IconNames';
import {AppConfiguration} from "@/constants/AppConfiguration";
import {StringHelper} from "@/helper/string/StringHelper";
import {Foodoffers, Foods} from "@/helper/database/databaseTypes/types";
import {SettingsRowGroup} from "@/components/settings/SettingsRowGroup";
import {SettingsRow} from "@/components/settings/SettingsRow";

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

export function FoodInformationListElement(props: {renderedIcon: any, label: string, value?: number | string | null, unit?: string | null}) {
	const translation_no_value = useTranslation(TranslationKeys.no_value);

	let usedIcon = props.renderedIcon;

	const value = props.value;
	const unit = props.unit;
	let valueWithUnit = "";
	const valueDataFound = value !== null && value !== undefined && value !== "";
	if (valueDataFound) {
		valueWithUnit = ""+value.toString();
	}
	if(unit) {
		valueWithUnit += unit;
	}

	return (
		<View style={{ flex: 1, flexDirection: 'row', paddingBottom: 12 }}>
			<View style={{ flexDirection: 'column' }}>
				{usedIcon}
			</View>
			<View style={{ marginLeft: 4, flex: 1}}>
				<Text>
					{valueDataFound ? valueWithUnit : translation_no_value}
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

export function FoodDataList(props: FoodInformationListProps) {
	const [
		translation_calories,
		translation_protein,
		translation_fat,
		translation_carbohydrate,
		translation_fiber,
		translation_sugar,
		translation_sodium,
		translation_saturated_fat,
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

	const nonBreakableSpace = StringHelper.NONBREAKING_SPACE;

	const data_nutrition: {
    key: string;
    data: {icon: string, label: string, value?: number | null, unit?: string}
  }[] = [
  	{ key: 'calories', data: {icon: IconNames.nutrition_calories_icon, label: translation_calories, value: props.data.calories_kcal, unit: nonBreakableSpace+"kcal"} },
  	{ key: 'carbohydrates', data: {icon: IconNames.nutrition_carbohydrate_icon, label: translation_carbohydrate, value: props.data.carbohydrate_g, unit: nonBreakableSpace+"g"} },
  	{ key: 'fiber', data: {icon: IconNames.nutrition_fiber_icon, label: translation_fiber, value: props.data.fiber_g, unit: nonBreakableSpace+"g"} },
  	{ key: 'protein', data: {icon: IconNames.nutrition_protein_icon, label: translation_protein, value: props.data.protein_g, unit: nonBreakableSpace+"g"} },
  	{ key: 'sodium', data: {icon: IconNames.nutirtion_sodium_icon, label: translation_sodium, value: props.data.sodium_g, unit: nonBreakableSpace+"g"} },
  	{ key: 'fat', data: {icon: IconNames.nutrition_fat_icon, label: translation_fat, value: props.data.fat_g, unit: nonBreakableSpace+"g"} },
  	{ key: 'sugar', data: {icon: IconNames.nutrition_sugar_icon, label: translation_sugar, value: props.data.sugar_g, unit: nonBreakableSpace+"g"} },
  	{ key: 'saturatedFat', data: {icon: IconNames.nutrition_saturated_fat_icon, label: translation_saturated_fat, value: props.data.saturated_fat_g, unit: nonBreakableSpace+"g"} },
  ]

	const data_environmental_impact: {
		key: string;
		data: {icon: string, label: string, value?: number | string | null, unit?: string}
	}[] = [
		{ key: 'environmental_impact_co2', data: {icon: IconNames.environmental_impact_co2_icon, label: translation_environmental_impact_co2, value: props.data.co2_g, unit: nonBreakableSpace+"g"} },
		{ key: 'environmental_impact_co2_saving_percentage', data: {icon: IconNames.environmental_impact_co2_saving_percentage_icon, label: translation_environmental_impact_co2_saving_percentage, value: props.data.co2_saving_percentage, unit: nonBreakableSpace+"%"} },
		{ key: 'environmental_impact_co2_rating', data: {icon: IconNames.environmental_impact_co2_rating_icon, label: translation_environmental_impact_co2_rating, value: props.data.co2_rating} },
	]

	const amountColumns = props.columnAmount || 2;

	let renderedNutritionInformation = null;
	if(AppConfiguration.DEFAULT_FOOD_NUTRITION_SHOW) {
		renderedNutritionInformation = <SettingsRowGroup>
			<SettingsRow leftIcon={IconNames.nutrition_icon} labelLeft={translations_nutrition} accessibilityLabel={translations_nutrition} />
			<MyGridFlatList amountColumns={amountColumns}
							data={data_nutrition}
							renderItem={(item) => {
								let renderedIcon = <Icon name={item.item.data.icon}/>
								return <FoodInformationListElement renderedIcon={renderedIcon} {...item.item.data}/>
							}}
			/>
		</SettingsRowGroup>
	}

	let renderedEnvironmentalImpactInformation = null;
	if(AppConfiguration.DEFAULT_ENVIRONMENTAL_IMPACT_SHOW) {
		renderedEnvironmentalImpactInformation = <SettingsRowGroup>
			<SettingsRow leftIcon={IconNames.environmental_impact_icon} labelLeft={translation_environmental_impact} accessibilityLabel={translation_environmental_impact} />
			<MyGridFlatList amountColumns={amountColumns}
							data={data_environmental_impact}
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