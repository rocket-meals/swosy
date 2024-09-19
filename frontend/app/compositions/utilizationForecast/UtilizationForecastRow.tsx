import React, {useRef} from 'react';
import {DimensionValue, ScrollView} from 'react-native';
import {UtilizationForecastBar} from './UtilizationForecastBar';
import {useViewBackgroundColor, View, Text} from '@/components/Themed';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {useLighterOrDarkerColorForSelection} from "@/helper/color/MyContrastColor";
import {useIsDebug} from "@/states/Debug";

const paddingLeft = 5;

export type Percentage = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 |
21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 |
41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50 | 51 | 52 | 53 | 54 | 55 | 56 | 57 | 58 | 59 | 60 |
61 | 62 | 63 | 64 | 65 | 66 | 67 | 68 | 69 | 70 | 71 | 72 | 73 | 74 | 75 | 76 | 77 | 78 | 79 | 80 |
81 | 82 | 83 | 84 | 85 | 86 | 87 | 88 | 89 | 90 | 91 | 92 | 93 | 94 | 95 | 96 | 97 | 98 | 99 | 100;

export type UtilizationDictData = {
    [key: string]: UtilizationData
}
export type UtilizationData = {
    start: string,
    end: string,
    percentage: Percentage
}

export function clampNumberToPercentage(value: number): Percentage {
	value = Math.round(value);
	return Math.min(100, Math.max(0, value)) as Percentage;
}

export type UtilizationForecastRowProps = {
	percentage_until_low: Percentage,
	percentage_until_medium: Percentage,
	percentage_until_high: Percentage,
    // utilization is a dict with key to UtilizationData
    data: UtilizationDictData
}
export const UtilizationForecastRow = (props: UtilizationForecastRowProps) => {
	const isDebug = useIsDebug()
	const translation_utilization = useTranslation(TranslationKeys.utilization);
	const translation_time_of_day = useTranslation(TranslationKeys.time_of_day);

	const viewBackgroundColor = useViewBackgroundColor();
	const lightOrDarkerBackgroundColor = useLighterOrDarkerColorForSelection(viewBackgroundColor);

	const myScrollViewRef = useRef(null);

	const utilization = props?.data

	function getColorForTraffic(traffic: number | undefined) {
		const lowest = props.percentage_until_low
		const medium = props.percentage_until_medium
		const max = props.percentage_until_high

		const colors = {
			[lowest+'']: '#93c34b',
			[medium+'']: '#FFD500',
			[max+'']: '#F5A13C'
		};

		// colorsWithCorrectKeys is a dict with keys as string
		const colorsWithCorrectKeys: {[key: string]: string} = {};
		for (const key in colors) {
			const parsedKey = parseInt(key+'');
			colorsWithCorrectKeys[parsedKey] = colors[key];
		}

		const colorBorders = Object.keys(colorsWithCorrectKeys).sort((a, b) => {
			return parseInt(a) - parseInt(b);
		});
		let lastColor = colors[colorBorders[0]];
		for (let i = 0; i < colorBorders.length; i++) {
			const border: string = colorBorders[i];
			if (traffic!==undefined) {
				if (traffic >= parseInt(border)) {
					lastColor = colorsWithCorrectKeys[border];
				}
			}
		}
		return lastColor;
	}

	function getCurrentActiveIndex(date: Date, utilization: UtilizationDictData) {
		let activeIndex = -1;
		const keys = Object.keys(utilization);

		let compareTime: Date | null = null;
		let diffInMinutes: null | number = null;

		for (let i = 0; i < keys.length; i++) { //search in all for the maximum value
			const populartime = utilization[keys[i]];

			const time = populartime.start || '';

			const timeParts = time.split(':');
			const HH = timeParts[0];
			const mm = timeParts[1];

			const nextCompareTime = new Date(date);
			nextCompareTime.setHours(parseInt(HH), parseInt(mm), 0, 0);
			if (compareTime) {
				diffInMinutes = (nextCompareTime.getTime() - compareTime.getTime()) / 1000 / 60;
			}
			compareTime = nextCompareTime;
			if (date>=compareTime) {
				activeIndex = i;
			}
		}

		if (diffInMinutes !== null && !!compareTime) {
			const nextCompareTime = new Date(compareTime);
			nextCompareTime.setMinutes(nextCompareTime.getMinutes() + diffInMinutes);
			if (date>=nextCompareTime) {
				activeIndex = keys.length;
			}
		}

		return activeIndex;
	}

	function getBestIndexToScrollTo(now: Date, utilization: UtilizationDictData) {
		let activeIndex = getCurrentActiveIndex(now, utilization);
		let firstIndexPercentageNotZero = -1;
		let lastIndexPercentageNotZero = -1;

		const populartimes = utilization;

		const keys = Object.keys(populartimes);

		for (let i = 0; i < keys.length; i++) { //search in all for the maximum value
			const populartime = populartimes[keys[i]];

			const percentage = populartime.percentage;
			if(percentage !== 0 && firstIndexPercentageNotZero === -1){
				firstIndexPercentageNotZero = i;
			}
			if(percentage !== 0){
				lastIndexPercentageNotZero = i;
			}
		}

		const scrollOffset = 2 // we want to show 2 items before the active item

		let bestIndex = activeIndex - scrollOffset;
		//if our current time is before the first time with a percentage not 0
		if(firstIndexPercentageNotZero !== -1 && activeIndex < firstIndexPercentageNotZero){
			bestIndex = firstIndexPercentageNotZero - scrollOffset; // we want to show the first time with a percentage not 0
		}
		//if our current time is after the last time with a percentage not 0
		if(lastIndexPercentageNotZero !== -1 && activeIndex > lastIndexPercentageNotZero){
			bestIndex = lastIndexPercentageNotZero - scrollOffset; // we want to show the last time with a percentage not 0
		}

		return bestIndex;
	}

	function scrollToElement(indexOf: number) {
		const totalItemWidth = getItemWidth()+paddingLeft;
		const offset = 1*totalItemWidth;
		let x = 0;

		const keys = getTimeKeys();

		if (indexOf===-1) { //if we have no active index
			indexOf = -1;
		} else { //if we have an active index
			if (indexOf>=keys.length) { //if we are at the end
				indexOf = keys.length; //we want to show the last item
			} else if (indexOf<0) { //if we are at the beginning
				indexOf = 0; //we want to show the first item
			}
			const itemXPosition = indexOf*totalItemWidth;
			x = x+itemXPosition-offset; // we want to show half of the previous item
			if(x < 0){ //if we are at the beginning
				x = 0; //we want to show the first item
			}
		}

		if (!isNaN(x) && !!myScrollViewRef && !!myScrollViewRef?.current) {
			const scrollView = myScrollViewRef.current as ScrollView;
			scrollView.scrollTo({ x: x, y: 0, animated: true });
		}
	}

	function getNow() {
		const now = new Date();
		//now = new Date("2023-12-01T11:00:00.000Z"); //TODO remove
		return now;
	}

	function getItemWidth() {
		return 40
	}

	function getClosedBarWidth() {
		return 6*getItemWidth();
	}

	function getTimeKeys() {
		const keys = Object.keys(utilization);
		return keys;
	}

	function getMaxHeight(){
		return 200;
	}

	/**
     * Render Rush Minutes
     * @returns {Array}
     */
	function renderPopularTimeCols() {
		if (!utilization) {
			return null
		}

		const maxHeight = getMaxHeight();
		const now = getNow();
		const activeIndex = getCurrentActiveIndex(now, utilization);
		const bestIndexToScrollTo = getBestIndexToScrollTo(now, utilization);
		const keys = getTimeKeys();
		const width = getItemWidth();

		const cols = [];

		for (let i = 0; i < keys.length; i++) { //for all rush minutes
			const populartime = utilization[keys[i]];
			const value = populartime.percentage;

			let height = (maxHeight) * (value / 100);

			const time = populartime.start || '';
			const timeParts = time.split(':');
			const HH = timeParts[0];
			const mm = timeParts[1];

			const timeAsString = '' + HH + ':' + mm;

			const isFullHour = parseInt(mm) === 0;

			let text = '';
			let renderedText = null;
			const renderedTextInside = '';
			text = isFullHour ? HH : '  ';
			renderedText = text;

			const bgColor = getColorForTraffic(value);

			const tooltip = translation_utilization+': '+ timeAsString+' - '+ value + '%';
			const accessibilityLabel = tooltip

			const isActive = i === activeIndex;
			cols.push(
				renderBar(maxHeight, height, width, bgColor, renderedText, renderedTextInside, isActive, tooltip, accessibilityLabel, populartime)
			);
		}

		const scrollViewContent = (
			<View
				accessibilityLabel={'UtilizationForecastRow'}
				style={{alignItems: 'flex-end', flexGrow: 1, flexDirection: 'row'}}
			>
				{cols}
			</View>
		)

		function renderDebug() {
			if(isDebug) {
				return (
					<View style={{
						width: '100%',
					}}>
						<Text>{"activeIndex: "+activeIndex}</Text>
						<Text>{"bestIndexToScrollTo: "+bestIndexToScrollTo}</Text>
					</View>
				)
			}
		}

		return (
			<View style={{
				width: '100%',
				flexDirection: 'column',
			}}>
				<View style={{flexGrow: 1, flexDirection: 'row'}}>
					<ScrollView
						ref={myScrollViewRef}
						onLayout={(event) => {
							if (myScrollViewRef) {
								setTimeout(() => {
									const now = getNow();
									const bestIndex = getBestIndexToScrollTo(now, utilization);
									scrollToElement(bestIndex);
								}, 500);
							}
						}}
						contentContainerStyle={{alignItems: 'flex-end' /* No use of flex: 1 or width: "100%" not working on android*/}}
						horizontal={true}
						style={{flex: 1}}
					>
						{scrollViewContent}
					</ScrollView>
				</View>
				{renderDebug()}
			</View>
		);
	}

	function renderBar(maxHeight: DimensionValue, height: DimensionValue, width: DimensionValue, bgColor: string, textBelow: string | null, textInside: string | null, isActive?: boolean, tooltip?: string, accessibilityLabel?: string, populartime?: UtilizationData
	) {
		return <UtilizationForecastBar populartime={populartime} maxHeight={maxHeight} height={height} width={width} bgColor={bgColor} textInside={textInside} textBelow={textBelow} isActive={isActive} tooltip={tooltip} accessibilityLabel={accessibilityLabel} />
	}

	const paddingTop = 5;

	return (
		<View style={{width: '100%', paddingBottom: 0}}>
			<View style={{flexDirection: 'row'}}>
				<View style={{flex: 1, paddingTop: paddingTop}}>
					{renderPopularTimeCols()}
					<View style={{
						width: "100%",
						justifyContent: 'center',
						paddingTop: 10,
					}}>
						<Text style={{
							textAlign: 'center',
						}}>
							{translation_time_of_day}
						</Text>
					</View>
				</View>
			</View>
		</View>
	);
}
