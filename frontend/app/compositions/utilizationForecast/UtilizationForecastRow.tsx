import React, {useRef} from 'react';
import {DimensionValue, ScrollView} from 'react-native';
import {UtilizationForecastBar} from './UtilizationForecastBar';
import { View} from '@/components/Themed';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';

const paddingLeft = 5;

const maxCharacters = 1024;
const minCharacters = 16;


export type UtilizationDictData = {
    [key: string]: UtilizationData
}
export type UtilizationData = {
    start: string,
    end: string,
    traffic: number | undefined
}

export type UtilizationForecastRowProps = {
    translation_openedFrom: string,
    translation_closedAfter: string,
    // utilization is a dict with key to UtilizationData
    data: UtilizationDictData
}
export const UtilizationForecastRow = (props: UtilizationForecastRowProps) => {
	const translation_utilization = useTranslation(TranslationKeys.utilization);

	const rushMinutes_openedFrom= props.translation_openedFrom
	const rushMinutes_closedAfter = props.translation_closedAfter

	const myScrollViewRef = useRef(null);

	const utilization = props?.data

	function getColorForTraffic(traffic: number | undefined) {
		const maxValue = 100;
		const lowest = (0)*maxValue;
		const medium = (3.0/6.0)*maxValue;
		const max = (5.0/6.0)*maxValue;

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

	function getActiveIndex(now: Date, utilization: UtilizationDictData) {
		let activeIndex = -1;

		const nowHour = now.getHours();
		const nowMinute = now.getMinutes();

		const populartimes = utilization;

		const keys = Object.keys(populartimes);

		let compareTime: Date | null = null;
		let diffInMinutes: null | number = null;

		for (let i = 0; i < keys.length; i++) { //search in all for the maximum value
			const populartime = populartimes[keys[i]];

			const time = populartime.start || '';
			const timeParts = time.split(':');
			const HH = timeParts[0];
			const mm = timeParts[1];

			const nextCompareTime = new Date(now);
			nextCompareTime.setHours(parseInt(HH), parseInt(mm), 0, 0);
			if (compareTime) {
				diffInMinutes = (nextCompareTime.getTime() - compareTime.getTime()) / 1000 / 60;
			}
			compareTime = nextCompareTime;
			if (now>=compareTime) {
				activeIndex = i;
			}
		}

		if (diffInMinutes !== null && !!compareTime) {
			const nextCompareTime = new Date(compareTime);
			nextCompareTime.setMinutes(nextCompareTime.getMinutes() + diffInMinutes);
			if (now>=nextCompareTime) {
				activeIndex = keys.length;
			}
		}

		return activeIndex;
	}

	function scrollToElement(indexOf: number) {
		const amountInfront = 3;

		const totalItemWidth = getItemWidth()+paddingLeft;
		const offset = 0.5*totalItemWidth;
		let x = 0;

		const keys = getTimeKeys();

		if (indexOf===-1) {
			indexOf = -1;
		} else {
			if (indexOf>=keys.length) {
				indexOf = keys.length;
			} else {
				if (indexOf > (amountInfront-1)) {
					indexOf-=(amountInfront-1);
				} else {
					indexOf = 0;
				}
			}
			const preItems = getClosedBarWidth()+paddingLeft;
			const itemXPosition = preItems+(indexOf*totalItemWidth);
			x = x+itemXPosition-offset; // we want to show half of the previous item
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

	function renderClosedBar(first: boolean, isActive: boolean, lastTime: string | null) {
		let text = '';
		if (first) {
			text = rushMinutes_openedFrom
		} else {
			text = rushMinutes_closedAfter
		}

		const firstRenderedText = (
			text+': '+lastTime
		)

		let textBelowPlaceholder = null;
		textBelowPlaceholder = (
			' '
		);

		//let borderColor = active ? this.fontStyles.normal.color : "transparent"; // TODO:

		return renderBar(getItemWidth(), getClosedBarWidth(), 'transparent', textBelowPlaceholder, firstRenderedText, isActive);
	}

	function getTimeKeys() {
		const keys = Object.keys(utilization);
		return keys;
	}

	/**
     * Render Rush Minutes
     * @returns {Array}
     */
	function renderPopularTimeCols() {
		if (!utilization) {
			return null
		}

		const now = getNow();

		const activeIndex = getActiveIndex(now, utilization);

		const keys = getTimeKeys();

		const width = getItemWidth();

		const cols = [];

		let lastTime = null;
		for (let i = 0; i < keys.length; i++) { //for all rush minutes
			const populartime = utilization[keys[i]];
			const value = populartime.traffic;

			let height = getItemWidth();
			if (value !== undefined) {
				height = (height * 5) * (value / 100);
			}

			const time = populartime.start || '';
			const timeParts = time.split(':');
			const HH = timeParts[0];
			const mm = timeParts[1];

			const timeEnd = populartime.end || '';
			const timeEndParts = timeEnd.split(':');
			const HH_end = timeEndParts[0];
			const mm_end = timeEndParts[1];
			lastTime = '' + HH_end + ':' + mm_end;
			const timeAsString = '' + HH + ':' + mm;

			if (i === 0) {
				const openingTime = '' + HH + ':' + mm
				const isActive = activeIndex === -1;
				cols.push(renderClosedBar(true, isActive, openingTime));
			}

			const isFullHour = parseInt(mm) === 0;

			let text = '';
			let renderedText = null;
			const renderedTextInside = '';
			text = isFullHour ? HH : '  ';
			renderedText = text;

			//let bgColor = popularTimeHour === nowHour ? "#FFD500" : "#ffffff";
			const bgColor = getColorForTraffic(value);

			const tooltip = translation_utilization+': '+ timeAsString+' - '+ value + '%';
			const accessibilityLabel = tooltip

			const isActive = i === activeIndex;
			cols.push(
				renderBar(height, width, bgColor, renderedText, renderedTextInside, isActive, tooltip, accessibilityLabel)
			);
		}

		const placeHolderRenderedText = (' ');
		//add empty item to fill the rest of the space

		const isActive = activeIndex === keys.length;
		if (keys.length > 0) {
			cols.push(renderClosedBar(false, isActive, lastTime));
		}
		//cols.push(renderBar(getItemWidth(), getItemWidth(), "transparent", placeHolderRenderedText, null, false));

		const scrollViewContent = (
			<View
				accessibilityLabel={'UtilizationForecastRow'}
				style={{alignItems: 'flex-end', flexGrow: 1, flexDirection: 'row'}}
			>
				{cols}
			</View>
		)


		return (
			<View style={{flexGrow: 1, flexDirection: 'row'}}>
				<ScrollView
					ref={myScrollViewRef}
					onLayout={(event) => {
						if (myScrollViewRef) {
							setTimeout(() => {
								const now = getNow();
								const activeIndex = getActiveIndex(now, utilization);
								scrollToElement(activeIndex);
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
		);
	}

	function renderBar(height: DimensionValue, width: DimensionValue, bgColor: string, textBelow: string | null, textInside: string | null, isActive?: boolean, tooltip?: string, accessibilityLabel?: string
	) {
		return <UtilizationForecastBar height={height} width={width} bgColor={bgColor} textInside={textInside} textBelow={textBelow} isActive={isActive} tooltip={tooltip} accessibilityLabel={accessibilityLabel} />
	}

	const paddingTop = 5;

	return (
		<View style={{width: '100%', paddingBottom: 0}}>
			<View style={{flexDirection: 'row'}}>
				<View style={{flex: 1, paddingTop: paddingTop}}>
					{renderPopularTimeCols()}
				</View>
			</View>
		</View>
	);
}
