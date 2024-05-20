import {MySafeAreaView} from '@/components/MySafeAreaView';
import React, {useEffect, useState} from 'react';
import {Heading, MySpinner, Text, TEXT_SIZE_SMALL, useViewBackgroundColor, View} from '@/components/Themed';
import {useLocalSearchParams} from 'expo-router';
import {getFoodOffersForSelectedDate} from "@/states/SynchedFoodOfferStates";
import {useIsDemo} from "@/states/SynchedDemo";
import {Foodoffers} from "@/helper/database/databaseTypes/types";
import {useSynchedCanteenById} from "@/states/SynchedCanteens";
import {DateHelper} from "@/helper/date/DateHelper";
import {useMyContrastColor} from "@/helper/color/MyContrastColor";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {useProfileLanguageCode, useProfileLocaleForJsDate} from "@/states/SynchedProfile";
import {getFoodName} from "@/helper/food/FoodTranslation";
import {formatPrice} from "@/components/pricing/PricingBadge";
import {ErrorGeneric} from "@/compositions/errors/ErrorGeneric";

export const FOODPLAN_DATE_START_WEEK_CURRENT = "current";

export default function FoodplanScreen() {

	const { canteen_id } = useLocalSearchParams<{ canteen_id: string }>();
	const { date_start_week_iso_or_current } = useLocalSearchParams<{ date_start_week_iso_or_current: string }>();
	const isDemo = useIsDemo();
	const canteen = useSynchedCanteenById(canteen_id);
	const AMOUNT_DAYS = 7;
	const viewBackgroundColor = useViewBackgroundColor();
	const viewContrastColor = useMyContrastColor(viewBackgroundColor);
	const textColorForViewContrastColor = useMyContrastColor(viewContrastColor)
	const translation_weekday = useTranslation(TranslationKeys.weekday)
	const localeForJsDate = useProfileLocaleForJsDate()
	const [languageCode, setLanguageCode] = useProfileLanguageCode()

	let date_start_week_iso = date_start_week_iso_or_current+"";
	if(date_start_week_iso_or_current===FOODPLAN_DATE_START_WEEK_CURRENT){
		date_start_week_iso = DateHelper.getPreviousMonday(new Date()).toISOString();
	}

	let startDate = new Date(date_start_week_iso+"");

	type DataItem = { date_iso: string, offers: Foodoffers[] | undefined }
	const [weekOffers, setWeekOffers] = useState<DataItem[] | undefined | null>(undefined);

	async function loadWeekOffers(){
		console.log("loadWeekOffers");
		console.log("caneen: "+canteen);
		if(!!canteen){
			try{
				let nextWeekOffers: DataItem[] = [];
				let tempDate = new Date(startDate);
				for(let i=0; i<AMOUNT_DAYS; i++){
					console.log("Load offers for index: "+i)
					const copyDate = new Date(tempDate.toISOString());
					console.log(copyDate.toISOString());
					let offers = await getFoodOffersForSelectedDate(isDemo, copyDate, canteen)
					nextWeekOffers.push({
						date_iso: copyDate.toISOString(),
						offers: offers
					});
					tempDate = DateHelper.addDays(tempDate, 1);
				}
				setWeekOffers(nextWeekOffers);
			} catch (err: any){
				setWeekOffers(null);
			}
		} else {
			setWeekOffers(null)
		}

	}

	useEffect(() => {
		loadWeekOffers()
	}, [canteen_id, date_start_week_iso, isDemo])

	function renderHeaderRow(){
		return <View>
			<View style={{width: "100%"}}>
				<Heading>{canteen?.alias}</Heading>
			</View>
			<View style={{backgroundColor: viewContrastColor, width: "100%"}}>
				<View style={{flex: 1}}>
					<Text style={{color: textColorForViewContrastColor}}>{translation_weekday}</Text>
				</View>
			</View>
		</View>
	}

	function renderFoodoffer(offer: Foodoffers){
		let food = offer.food;
		let title = getFoodName(food, languageCode)

		const formated_price_student = formatPrice(offer.price_student);
		const formated_price_employee = formatPrice(offer.price_employee);
		const formated_price_guest = formatPrice(offer.price_guest);
		const formated_prices = [formated_price_student, formated_price_employee, formated_price_guest];
		const price_information = formated_prices.join(" / ");

		return <View style={{
			flex: 1,
			paddingHorizontal: 5
		}}>
			<View style={{
			}}>
				<Text>{title}</Text>
				<Text size={TEXT_SIZE_SMALL}>{price_information}</Text>
			</View>
		</View>
	}

	function renderFoodoffersForRow(offers: Foodoffers[] | undefined){
		if(!offers){
			return null;
		}

		let output = [];
		for(let offer of offers){
			output.push(renderFoodoffer(offer));
		}
		return (
			<View style={{
				flexDirection: "row",
				flex: 1
			}}>
				{output}
			</View>
		)
	}

	function renderOffersForDayRow(iso_date: string, offers: Foodoffers[] | undefined){
		const date = new Date(iso_date);
		let weekdayName = DateHelper.getWeekdayNameByDate(date, localeForJsDate, true)
		let weekdayDate = DateHelper.formatOfferDateToReadable(date, false, false);

		return <View style={{width: "100%", borderBottomColor: viewContrastColor, borderBottomWidth: 1, flexDirection: "row"}}>
			<View style={{flex: 1}}>
				<View>
					<Heading>{weekdayName}</Heading>
				</View>
				<View>
					<Text>{weekdayDate}</Text>
				</View>
			</View>
			<View style={{flex: 11}}>
				{renderFoodoffersForRow(offers)}
			</View>
		</View>
	}

	function renderWeekOffers(){
		let output = [];
		output.push(renderHeaderRow());
		if(!!weekOffers){
			for(let i=0; i<weekOffers.length; i++){
				let dayItem = weekOffers[i];
				const iso_date = dayItem.date_iso;
				output.push(renderOffersForDayRow(iso_date, dayItem.offers));
			}
		}
		if(weekOffers===undefined){
			output.push(<MySpinner />)
		}
		if(weekOffers===null){
			output.push(<ErrorGeneric />)
		}

		return output;
	}

	return (
		<MySafeAreaView>
			{renderWeekOffers()}
		</MySafeAreaView>
	);
}