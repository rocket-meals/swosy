import {
	getLineHeightInPixelBySize,
	IconDefaultSize,
	Text,
	TEXT_SIZE_DEFAULT,
	useViewBackgroundColor,
	View
} from '@/components/Themed';
import {StringHelper} from "@/helper/string/StringHelper";
import {
	Foodoffers,
	Foods,
	FoodsAttributes,
	FoodsAttributesGroups,
	FoodsAttributesValues
} from "@/helper/database/databaseTypes/types";
import {SettingsRowGroup} from "@/components/settings/SettingsRowGroup";
import {SETTINGS_ROW_DEFAULT_PADDING, SettingsRow} from "@/components/settings/SettingsRow";
import {NumberHelper} from "@/helper/number/NumberHelper";
import {FoodAttributesDict, useSynchedFoodsAttributesDict} from "@/states/SynchedFoodattributes";
import {FoodAttributesGroupsDict, useSynchedFoodsAttributesGroupsDict} from "@/states/SynchedFoodattributesGroups";
import {
	getDirectusTranslation,
	hasDirectusTranslation,
	TranslationEntry
} from "@/helper/translations/DirectusTranslationUseFunction";
import {useProfileLanguageCode} from "@/states/SynchedProfile";
import {ItemStatusFilter} from "@/helper/database/ItemStatus";
import DirectusImageOrIconComponent, {
	DirectusImageOrIconWithModalComponent,
	hasResourceImageIconOrRemoteImage,
	hasResourceImageOrRemoteImage
} from "@/components/image/DirectusImageOrIconComponent";
import React from "react";
import {useMyContrastColor} from "@/helper/color/MyContrastColor";
import {MyGridFlatList} from "@/components/grid/MyGridFlatList";
import {ThemedMarkdown} from "@/components/markdown/ThemedMarkdown";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {MarkingIconOrShortCodeWithTextSize} from "@/components/food/MarkingBadge";
import {useIconWithInPixel} from "@/components/shapes/Rectangle";

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

function getFoodAttributeGroupFromAttributeValues(attribute_value: FoodsAttributesValues, foodAttributesDict: FoodAttributesDict, foodAttributesGroupsDict: FoodAttributesGroupsDict): FoodsAttributesGroups | null | undefined {
	const food_attribute = attribute_value.food_attribute
	let food_attribute_id: string | null | undefined = null;
	if(typeof food_attribute === "string") {
		food_attribute_id = food_attribute
	} else if(food_attribute) {
		food_attribute_id = food_attribute.id;
	}
	if(food_attribute_id && foodAttributesDict) {
		const food_attribute = foodAttributesDict[food_attribute_id];
		if(food_attribute) {
			const food_attribute_group_raw = food_attribute.group;
			let food_attribute_group_id: string | null | undefined = null;
			if(typeof food_attribute_group_raw === "string") {
				food_attribute_group_id = food_attribute_group_raw;
			} else if(food_attribute_group_raw) {
				food_attribute_group_id = food_attribute_group_raw.id;
			}
			if(food_attribute_group_id && foodAttributesGroupsDict) {
				const food_attribute_group = foodAttributesGroupsDict[food_attribute_group_id];
				if(food_attribute_group) {
					return food_attribute_group;
				}
			}
		}
	}
	return null;
}

function getSortedFoodAttributesGroups(foodAttributesGroups: FoodsAttributesGroups[]): FoodsAttributesGroups[] {
	return foodAttributesGroups.sort((a, b) => {
		let aSort = a.sort || 0;
		let bSort = b.sort || 0;
		return aSort - bSort; // smaller sort values come first
	});
}

export function getFoodAttributeFromFoodAttributeValue(foodAttributeValue: FoodsAttributesValues, foodAttributesDict: FoodAttributesDict): FoodsAttributes | null | undefined {
	const food_attribute = foodAttributeValue.food_attribute;
	let food_attribute_id: string | null | undefined = null;
	if(typeof food_attribute === "string") {
		food_attribute_id = food_attribute;
	} else if(food_attribute) {
		food_attribute_id = food_attribute.id;
	}
	if(food_attribute_id && foodAttributesDict) {
		const food_attribute = foodAttributesDict[food_attribute_id];
		if(food_attribute) {
			return food_attribute;
		}
	}
	return null;
}

function getSortedFoodAttributeValuesByFoodAttribute(foodAttributeValues: FoodsAttributesValues[], foodAttributesDict: FoodAttributesDict): FoodsAttributesValues[] {
	return foodAttributeValues.sort((a, b) => {
		let foodAttributeA = getFoodAttributeFromFoodAttributeValue(a, foodAttributesDict);
		let foodAttributeB = getFoodAttributeFromFoodAttributeValue(b, foodAttributesDict);
		let aSort = foodAttributeA?.sort || 0;
		let bSort = foodAttributeB?.sort || 0;
		return aSort - bSort; // smaller sort values come first
	});
}

function hasFoodAttributeValueAnyValue(foodAttributeValue: FoodsAttributesValues): boolean {
	return foodAttributeValue.number_value !== null || foodAttributeValue.string_value !== null || foodAttributeValue.boolean_value !== null;
}

export function getFoodAttributeValuesWhereFoodAttributeIsVisible(foodAttributeValues: FoodsAttributesValues[] | undefined, foodAttributesDict: FoodAttributesDict | undefined): FoodsAttributesValues[] | undefined {
	if(foodAttributeValues && foodAttributesDict) {
		return foodAttributeValues.filter((foodAttributeValue) => {
			let foodAttribute = getFoodAttributeFromFoodAttributeValue(foodAttributeValue, foodAttributesDict);
			if(foodAttribute) {
				// only show published food attributes
				return ItemStatusFilter.isItemStatusPublished(foodAttribute);
			}
			return true // if food attribute is not found, do not filter it out
		});
	}
	return undefined;
}

export const FoodAttributeImageOrIcon = ({foodAttribute, height, width}: {foodAttribute: FoodsAttributes, height: number, width: number}) => {
	const [languageCode, setLanguageCode] = useProfileLanguageCode()

	const viewBackgroundColor = useViewBackgroundColor()
	const viewBackgroundContrastColor = useMyContrastColor(viewBackgroundColor)
	const viewWhiteOrBlackBackgroundColor = useMyContrastColor(viewBackgroundContrastColor)
	const backgroundcolor = foodAttribute?.background_color || "#FFFFFF00"

	let backgroundColor = backgroundcolor
	const textColor = useMyContrastColor(backgroundColor);

	const hasImageOrRemoteImage = hasResourceImageOrRemoteImage(foodAttribute);
	const hasImageIconOrRemoteImage = hasResourceImageIconOrRemoteImage(foodAttribute);

	if(!backgroundColor && !hasImageOrRemoteImage){
		backgroundColor = viewWhiteOrBlackBackgroundColor;
	}

	const lineHeight = getLineHeightInPixelBySize(TEXT_SIZE_DEFAULT) || 10;
	const imageWidthAndHeight = lineHeight;

	const title = getFoodAttributeName(languageCode, foodAttribute);
	const accessibilityLabel = title;
	const label = title;

	let translationsFoodAttribute = foodAttribute?.translations as TranslationEntry[];
	const hasTranslation = hasDirectusTranslation(languageCode, translationsFoodAttribute, "description");
	let padding = SETTINGS_ROW_DEFAULT_PADDING/2;

	let renderAsContentInsteadItems: ((key: string, hide: () => void, backgroundColor: string) => Element) | undefined = undefined;

	if(hasTranslation) {
		// @ts-ignore
		renderAsContentInsteadItems = (key, hide, backgroundColor) => {
			return(
				<MyScrollView>
					<View style={{width: "100%", padding: SETTINGS_ROW_DEFAULT_PADDING}}>
						<View style={{width: "100%", alignItems: "center"}}>
							<View style={{
								//backgroundColor: "red"
							}}>
								<DirectusImageOrIconComponent iconSize={iconSizeInModal} resource={foodAttribute} widthImage={imageWidthAndHeight*3} heightImage={imageWidthAndHeight*3} iconColor={textColor} />
							</View>
						</View>
						<ThemedMarkdown markdown={translated_description} />
					</View>
				</MyScrollView>
			)
		}
	}

	const translated_description = getDirectusTranslation(languageCode, translationsFoodAttribute, "description");

	let iconSizeInModal = IconDefaultSize*3;

	return <DirectusImageOrIconWithModalComponent
		title={title}
		backgroundColor={backgroundColor}
		tooltip={title}
		accessibilityLabel={accessibilityLabel}
		label={label}
		key={foodAttribute.id}
		renderAsContentInsteadItems={renderAsContentInsteadItems}
		resource={foodAttribute} widthImage={width} heightImage={height} iconColor={textColor} />

}

function getFoodAttributeFormattedValue(foodAttributeValue: FoodsAttributesValues, foodAttribute?: FoodsAttributes | null | undefined): string | null {
	let prefix = "";
	let suffix = "";
	if(foodAttribute) {
		prefix = foodAttribute.prefix || "";
		suffix = foodAttribute.suffix || "";
	}
	let valueFormatted = null;

	if(foodAttributeValue.number_value !== null) {
		valueFormatted = NumberHelper.formatNumber(foodAttributeValue.number_value, suffix, false, ",", ".", 1);
		valueFormatted = prefix + valueFormatted;
	} else if(foodAttributeValue.string_value !== null) {
		valueFormatted = foodAttributeValue.string_value;
		valueFormatted = prefix + valueFormatted + suffix;
	} else if(foodAttributeValue.boolean_value !== null) {
		valueFormatted = foodAttributeValue.boolean_value ? "Yes" : "No";
		valueFormatted = prefix + valueFormatted + suffix;
	}

	if(valueFormatted === null || valueFormatted === undefined) {
		valueFormatted = "/";
	}

	return valueFormatted;
}

function getFoodAttributeName(languageCode: string, foodAttribute?: FoodsAttributes | null | undefined): string {
	let translationsFoodAttribute = foodAttribute?.translations as TranslationEntry[];
	let translatedAttributeName = getDirectusTranslation(languageCode, translationsFoodAttribute, "name");
	return translatedAttributeName;
}

export function getSortedListGroupsOfFoodAttributeValues(attribute_values: FoodsAttributesValues[] | undefined, foodAttributesDict: FoodAttributesDict, foodAttributesGroupsDict: FoodAttributesGroupsDict): FoodsAttributesValues[][] {
	let foodAttributesGroupIdToAttributeValuesDict: Record<string, FoodsAttributesValues[]> = {};
	let foodAttributesWithoutGroup: FoodsAttributesValues[] = [];

	if(attribute_values) {
		for(const attribute_value of attribute_values) {
			if(hasFoodAttributeValueAnyValue(attribute_value)) { // only show attributes with values
				let food_attribute_group = getFoodAttributeGroupFromAttributeValues(attribute_value, foodAttributesDict, foodAttributesGroupsDict);
				if(food_attribute_group){
					foodAttributesGroupIdToAttributeValuesDict[food_attribute_group.id] = foodAttributesGroupIdToAttributeValuesDict[food_attribute_group.id] || [];
					foodAttributesGroupIdToAttributeValuesDict[food_attribute_group.id].push(attribute_value);
				} else {
					foodAttributesWithoutGroup.push(attribute_value);
				}
			}
		}
	}

	let existingFoodAttributesGroups: FoodsAttributesGroups[] = [];
	if(foodAttributesGroupsDict) {
		for(const attribute_group_id in foodAttributesGroupIdToAttributeValuesDict) {
			const attribute_group = foodAttributesGroupsDict[attribute_group_id];
			if(attribute_group) {
				existingFoodAttributesGroups.push(attribute_group);
			}
		}
	}
	let sortedFoodAttributesGroups = getSortedFoodAttributesGroups(existingFoodAttributesGroups);
	let listOfGroupsOfFoodAttributeValues: FoodsAttributesValues[][] = [];
	for(const foodAttributesGroup of sortedFoodAttributesGroups) {
		let foodAttributeValues = foodAttributesGroupIdToAttributeValuesDict[foodAttributesGroup.id];
		if(foodAttributeValues.length > 0) {
			listOfGroupsOfFoodAttributeValues.push(foodAttributeValues);
		}
	}
	if(foodAttributesWithoutGroup.length > 0) {
		listOfGroupsOfFoodAttributeValues.push(foodAttributesWithoutGroup);
	}

	return listOfGroupsOfFoodAttributeValues;
}

export function FoodDataList(props: FoodInformationListProps) {
	const attribute_values_unfiltered = props.data.attribute_values;
	const [foodAttributesDict, setFoodAttributesDict] = useSynchedFoodsAttributesDict();
	const [foodAttributesGroupsDict, setFoodAttributesGroupsDict] = useSynchedFoodsAttributesGroupsDict();
	const [languageCode, setLanguageCode] = useProfileLanguageCode()
	const iconWidth = useIconWithInPixel();

	const attribute_values = getFoodAttributeValuesWhereFoodAttributeIsVisible(attribute_values_unfiltered, foodAttributesDict);
	let listOfGroupsOfFoodAttributeValues = getSortedListGroupsOfFoodAttributeValues(attribute_values, foodAttributesDict, foodAttributesGroupsDict);

	const amountColumns = props.columnAmount || 2;

	let renderedFoodAttributeGroupRows: any[] = [];

	let rowIndex = 0;
	for(const foodAttributeValues of listOfGroupsOfFoodAttributeValues) {
		let sortedFoodAttributeValues = getSortedFoodAttributeValuesByFoodAttribute(foodAttributeValues, foodAttributesDict);

		let data_nutrition: {
			key: string;
			data: FoodsAttributesValues
		}[] = []
		for(const foodAttributeValue of sortedFoodAttributeValues) {
			data_nutrition.push({
				key: foodAttributeValue.id,
				data: foodAttributeValue
			})
		}

		let renderedAttributeValues = <MyGridFlatList amountColumns={amountColumns}
													  data={data_nutrition}
													  renderItem={(listInfoItem) => {
														  let foodAttributeValue = listInfoItem.item.data;
														  let foodAttribute = getFoodAttributeFromFoodAttributeValue(foodAttributeValue, foodAttributesDict);

														  let translatedAttributeName = getFoodAttributeName(languageCode, foodAttribute);

														  let valueFormatted: string | null = getFoodAttributeFormattedValue(foodAttributeValue, foodAttribute);

														  let image: any = null;
														  if(foodAttribute) {
															  image = (
																  <View style={{
																	  //backgroundColor: "red"
																  }}>
																	  <FoodAttributeImageOrIcon foodAttribute={foodAttribute} height={iconWidth} width={iconWidth}/>
																  </View>
															  )
														  }
														  return <FoodInformationListElement renderedIcon={image} label={translatedAttributeName} valueFormatted={valueFormatted}/>
													  }}
		/>

		let foodAttributesGroup = getFoodAttributeGroupFromAttributeValues(foodAttributeValues[0], foodAttributesDict, foodAttributesGroupsDict);
		let displayedRowName = "";
		if(foodAttributesGroup) {
			let translationsFoodAttributeGroup = foodAttributesGroup.translations as TranslationEntry[]
			let translatedGroupName = getDirectusTranslation(languageCode, translationsFoodAttributeGroup, "name") || foodAttributesGroup.alias || foodAttributesGroup.id;
			displayedRowName = translatedGroupName;
		}
		renderedFoodAttributeGroupRows.push(
			<SettingsRowGroup key={rowIndex+""} label={displayedRowName}>
				{renderedAttributeValues}
			</SettingsRowGroup>
		)
		rowIndex++;
	}


	/**
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
		*/

	return (
		<View style={{
			width: "100%",
		}}>
			{renderedFoodAttributeGroupRows}
		</View>
	)
}