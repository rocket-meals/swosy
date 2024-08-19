import {Icon, Text, View} from '@/components/Themed';
import {MyGridFlatList} from '@/components/grid/MyGridFlatList';
import {TranslationKeys, useTranslation, useTranslations} from '@/helper/translations/Translation';
import {IconNames} from '@/constants/IconNames';
import {AppConfiguration} from "@/constants/AppConfiguration";

export type EnvironmentalImpactDataProps = {
	co2_g?: number | null | undefined ,
	co2_saving_percentage?: number | null | undefined ,
	co2_rating?: string | null | undefined ,
}
export type EnvironmentalImpactProps = {
	columnAmount?: number;
  	data: EnvironmentalImpactDataProps;
}

export function EnvironmentalImpactListElement(props: {renderedIcon: any, label: string, value?: number | string | null, unit?: string | null}) {
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

export default function EnvironmentalImpactList(props: EnvironmentalImpactProps) {
	const [
		translation_environmental_impact_co2,
		translation_environmental_impact_co2_saving_percentage,
		translation_environmental_impact_co2_rating
	] = useTranslations([
		TranslationKeys.environmental_impact_co2,
		TranslationKeys.environmental_impact_co2_saving_percentage,
		TranslationKeys.environmental_impact_co2_rating,
	])

	const data: {
    key: string;
    data: {icon: string, label: string, value?: number | string | null, unit?: string}
  }[] = [
  	{ key: 'environmental_impact_co2', data: {icon: IconNames.environmental_impact_co2_icon, label: translation_environmental_impact_co2, value: props.data.co2_g, unit: "g"} },
  	{ key: 'environmental_impact_co2_saving_percentage', data: {icon: IconNames.environmental_impact_co2_saving_percentage_icon, label: translation_environmental_impact_co2_saving_percentage, value: props.data.co2_saving_percentage} },
  	{ key: 'environmental_impact_co2_rating', data: {icon: IconNames.environmental_impact_co2_rating_icon, label: translation_environmental_impact_co2_rating, value: props.data.co2_rating} },
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
					return <EnvironmentalImpactListElement renderedIcon={renderedIcon} {...item.item.data}/>
				}}
			/>
		</View>
	)
}