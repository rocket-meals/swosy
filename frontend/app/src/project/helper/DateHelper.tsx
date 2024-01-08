import React from "react";
import {StringHelper} from "./StringHelper";
import {useAppTranslation} from "../components/translations/AppTranslation";

export enum Weekday {
	MONDAY = "Monday",
	TUESDAY = "Tuesday",
	WEDNESDAY = "Wednesday",
	THURSDAY = "Thursday",
	FRIDAY = "Friday",
	SATURDAY = "Saturday",
	SUNDAY = "Sunday"
}

export class DateHelper {

	static Weekday = Weekday;

	static parseTime(time: string, date?): Date{
		let parts = time.split(":");
		let hours = parseInt(parts[0]) || 0;
		let minutes = parseInt(parts[1]) || 0;
		let seconds = parseInt(parts[2]) || 0;
		if(!date){
			date = new Date(); // create a new date object
		} else {
			date = new Date(date); // clone
		}
		date.setHours(hours);
		date.setMinutes(minutes);
		date.setSeconds(seconds);
		return date;
	}

	static getWeekdayEnumsValues(firstDayOfWeek?: Weekday) {
		let useFirstDayOfWeek = firstDayOfWeek || Weekday.MONDAY;

		let weekOrder = [
			Weekday.SUNDAY,
			Weekday.MONDAY,
			Weekday.TUESDAY,
			Weekday.WEDNESDAY,
			Weekday.THURSDAY,
			Weekday.FRIDAY,
			Weekday.SATURDAY,
		]
		let index = DateHelper.getWeekdayIndex(useFirstDayOfWeek);
		let output = [];
		for(let i=0; i<7; i++){
			output.push(weekOrder[index]);
			index++;
			if(index >= weekOrder.length){
				index = 0;
			}
		}
		return output;
	}

	static getWeekdayNames(locale?: string, firstDayOfWeek?: Weekday){
		let currentWeekDates = DateHelper.getCurrentWeekDates(undefined, firstDayOfWeek);
		let output = [];
		for(let date of currentWeekDates){
			output.push(DateHelper.getWeekdayNameByDate(date, locale));
		}
		return output;
	}

	static getWeekdayIndex(weekday: Weekday){
		switch(weekday){
			case Weekday.SUNDAY: return 0;
			case Weekday.MONDAY: return 1;
			case Weekday.TUESDAY: return 2;
			case Weekday.WEDNESDAY: return 3;
			case Weekday.THURSDAY: return 4;
			case Weekday.FRIDAY: return 5;
			case Weekday.SATURDAY: return 6;
		}
	}

	static getWeekdayDifference(from: Weekday, to: Weekday){
		let fromIndex = DateHelper.getWeekdayIndex(from);
		let toIndex = DateHelper.getWeekdayIndex(to);
		let difference = toIndex - fromIndex;
		return difference;
	}

	static getWeekdayByDayNumber(dayNumber: number){
		let enumValues = DateHelper.getWeekdayEnumsValues();
		return enumValues[dayNumber%enumValues.length];
	}

	static getWeekdayToday(){
		return DateHelper.getWeekdayByDate(new Date());
	}

	static getWeekdayByDate(date: Date){
		let weekdayIndex = date.getDay();
		let weekdayEnums = DateHelper.getWeekdayEnumsValues();
		let indexToWeekdayEnum = {};
		for(let i=0; i<weekdayEnums.length; i++){
			let weekdayEnum = weekdayEnums[i];
			let weekdayEnumIndex = DateHelper.getWeekdayIndex(weekdayEnum);
			indexToWeekdayEnum[weekdayEnumIndex] = weekdayEnum;
		}

		return indexToWeekdayEnum[weekdayIndex];
	}

	static getWeekdayNamesFirstLetters(locale?: string, firstDayOfWeek?: Weekday){
		let weekdayNames = DateHelper.getWeekdayNames(locale, firstDayOfWeek);
		let output = [];
		for(let weekdayName of weekdayNames){
			output.push(weekdayName[0]);
		}
		return output;
	}

	static getCurrentWeekDates(date?: Date, firstDayOfWeek?: Weekday){
		let firstDateOfWeek = DateHelper.getFirstDateOfWeek(undefined, firstDayOfWeek);
		let output = [];
		for(let i=0; i<7; i++){
			output.push(new Date(firstDateOfWeek));
			firstDateOfWeek.setDate(firstDateOfWeek.getDate()+1);
		}
		return output;
	}

	static getWeekdayNameFirstLetter(date: Date, locale?: string){
		let weekDayName = DateHelper.getWeekdayNameByDate(date, locale);
		if(!!weekDayName && weekDayName.length > 0){
			return weekDayName[0];
		} else {
			return "?"
		}
	}

	static getDefaultWeekdayDate(weekdayName: Weekday){
		if(!weekdayName){
			weekdayName = Weekday.MONDAY;
		}
		switch(weekdayName){
			case Weekday.MONDAY: return new Date("December 25, 1995 23:15:30");
			case Weekday.TUESDAY: return new Date("December 26, 1995 23:15:30");
			case Weekday.WEDNESDAY: return new Date("December 27, 1995 23:15:30");
			case Weekday.THURSDAY: return new Date("December 28, 1995 23:15:30");
			case Weekday.FRIDAY: return new Date("December 29, 1995 23:15:30");
			case Weekday.SATURDAY: return new Date("December 30, 1995 23:15:30");
			case Weekday.SUNDAY: return new Date("December 31, 1995 23:15:30");
		}
	}

	static getWeekdayTranslationByWeekday(weekdayName: Weekday, locale?: string){
		let date = DateHelper.getDefaultWeekdayDate(weekdayName);
		if(date){
			return DateHelper.getWeekdayNameByDate(date, locale);
		}
	}

	static getWeekdayNameByDate(date: Date, locale?: string){
		if(!locale){
			locale = "en-us";
		}
		const weekdayName = date.toLocaleString(locale, { weekday: "long" })
		return StringHelper.capitalizeFirstLetter(weekdayName);
	}

	static getMonthName(date: Date, locale?: string){
		if(!locale){
			locale = "en-us";
		}
		return date.toLocaleString(locale, { month: "long" });
	}

	static getAmountDaysFromLastMonthForWeekstart(date: Date, firstDayOfWeek: Weekday){
		let firstDayOfMonth = DateHelper.getFirstDayOfMonth(date);
		let weekDateOfFirstDayOfMonth = firstDayOfMonth.getDay() // e. G. 6 for thursday
		let firstDayOfWeekIndex = DateHelper.getWeekdayIndex(firstDayOfWeek);
		// firstDayOfWeek e. G. 1 for monday
		// firstDay of month e. G. saturday 01.10.2022
		// weekDateOfFirstDayOfMonth e. G. 6
		// 7+ (6 - 1) = 5
		let diffToStartWithFirstDayOfWeek = (7+(weekDateOfFirstDayOfMonth-firstDayOfWeekIndex))%7
		return diffToStartWithFirstDayOfWeek;
	}

	static getAmountDaysFromNextMonthToWeekend(date: Date, firstDayOfWeek: Weekday){
		let lastDayOfMonth = DateHelper.getFirstDayOfNextMonth(date);
		let amountDays = DateHelper.getAmountDaysFromLastMonthForWeekstart(lastDayOfMonth, firstDayOfWeek);
		return (7-amountDays);
	}

	static getAmountDaysInMonth(date: Date){
		let lastDayOfMonth = DateHelper.getLastDayOfMonth(date);
		return lastDayOfMonth.getDate();
	}

	static getLastDayOfMonth(date: Date){
		let lastDayInMonth = DateHelper.getFirstDayOfNextMonth(date)
		lastDayInMonth.setDate(lastDayInMonth.getDate()-1);
		return lastDayInMonth;
	}

	static getFirstDateOfWeek(date?: Date, firstDayOfWeek?: Weekday){
		let temp = !!date ? new Date(date) : new Date();
		let firstDayOfWeekIndex = DateHelper.getWeekdayIndex(firstDayOfWeek);
		if(firstDayOfWeek===undefined || firstDayOfWeek === null){
			firstDayOfWeekIndex = 0;
		}
		let diff = (7+temp.getDay()-firstDayOfWeekIndex)%7
		temp.setDate(temp.getDate()-diff)
		return temp;
	}

	static getFirstDayOfMonth(date: Date){
		let firstDayOfMonth = new Date(date)
		firstDayOfMonth.setDate(1); // e. G. 01.12.2022
		return firstDayOfMonth
	}

	static getFirstDayOfNextMonth(date: Date){
		let firstDayOfNextMonth = DateHelper.getFirstDayOfMonth(date);
		firstDayOfNextMonth.setMonth(firstDayOfNextMonth.getMonth()+1);
		return firstDayOfNextMonth;
	}

	static getDatesOfAmountNextDaysIncludingToday(startDate: Date, amount: number): [Date, Date][]{
		let dates: [Date, Date][] = [];
		let startOfTheDay = new Date(startDate); // copy the date
		let endOfTheDay = new Date(startDate); // copy the date
		startOfTheDay.setHours(0,0,0,0); // so set the start at the beginning of the day
		endOfTheDay.setHours(23,59,59,999); //set to end of day

		let futureDates = amount>0;
		let step = futureDates ? 1 : -1;
		let absAmount = Math.abs(amount);

		for(let i=0; i<absAmount; i++){
			startOfTheDay = new Date(startOfTheDay.toISOString());
			endOfTheDay = new Date(endOfTheDay.toISOString());

			let dayRange: [Date, Date] = [new Date(startOfTheDay.toISOString()), new Date(endOfTheDay.toISOString())]
			dates.push(dayRange); // push into list

			startOfTheDay.setDate(startOfTheDay.getDate()+step); //add one day
			endOfTheDay.setDate(endOfTheDay.getDate()+step); //add one day
		}

		if(!futureDates){
			dates.reverse();
		}

		return dates;
	}

	static sortDates(dates){
		let datesAsDates = [];
		for(let date of dates){
			if(typeof date==="string"){
				datesAsDates.push(new Date (date));
			} else {
				datesAsDates.push(date);
			}
		}
		datesAsDates.sort((date1, date2) => date1 - date2);
		return datesAsDates;
	}

	static addDays(date: Date, days: number){
		let tempDate = new Date(date);
		tempDate.setDate(tempDate.getDate()+days);
		return tempDate;
	}

	static addMinutes(date: Date, minutes: number){
		let tempDate = new Date(date);
		tempDate.setMinutes(tempDate.getMinutes()+minutes);
		return tempDate;
	}

	static formatToOfferDate(date: Date){
		let iso = date.toISOString();
		let trimmed = iso.slice(0, "YYYY-MM-DD".length);
		return trimmed;
	}

	static isSameDay(date1: Date, date2: Date){
		return date1.toDateString() === date2.toDateString();
	}

	// returns "Yesterday", "Today", "Tomorrow", or "Tuesday", "Wednesday" or the date in the format "DD.MM.YYYY"
	static useSmartReadableDate(date: Date, locale?: string){
		let today = new Date();
		let tomorrow = DateHelper.addDays(today, 1);
		let yesterday = DateHelper.addDays(today, -1);

		let translationToday = useAppTranslation("today");
		let translationTomorrow = useAppTranslation("tomorrow");
		let translationYesterday = useAppTranslation("yesterday");

		// check if date is today, then return "today"
		if(DateHelper.isSameDay(today, date)){
			return translationToday;
		}
		// check if date is tomorrow, then return "tomorrow"
		if(DateHelper.isSameDay(tomorrow, date)){
			return translationTomorrow;
		}
		// check if date is yesterday, then return "yesterday"

		if(DateHelper.isSameDay(yesterday, date)){
			return translationYesterday;
		}

		let oneWeekLater = DateHelper.addDays(today, 6);
		if(date >= yesterday && date <= oneWeekLater){
			return DateHelper.getWeekdayNameByDate(date, locale);
		}
		// else return "01.01.2021"
		return DateHelper.formatOfferDateToReadable(date, false, false);
	}

	static formatOfferDateToReadable(offerDate, withYear?, withTime?){
		let date = offerDate;
		if(!offerDate){
			date = new Date();
		}
		if(typeof offerDate==="string"){
			date = new Date(offerDate);
		}
		let iso = date.toISOString();
		let trimmed = iso.slice(0, "YYYY-MM-DD".length);
		let splits = trimmed.split("-");
		let years = splits[0];
		let month = splits[1];
		let days = splits[2];

		let firstPart = "";
		let hours = date.getHours();
		let minutes = date.getMinutes();
		if(withTime){
			let hoursWithPad = hours < 10 ? "0"+hours : hours;
			let minutesWithPad = minutes < 10 ? "0"+minutes : minutes;
			firstPart = hoursWithPad+":"+minutesWithPad+" ";
		}

		firstPart+=days+"."+month+"."
		if(withYear){
			return firstPart+years;
		} else {
			return firstPart;
		}
	}

	static formatMinutesToReadable(minutes: number){
		let hours = Math.floor(minutes/60);
		let minutesLeft = minutes%60;
		let readable = DateHelper.formatHoursAndMinutesToHH_MM(hours, minutesLeft);
		return readable+" h";
	}

	static getDateInMinutes(date: Date, minutes: number){
		let tempDate = new Date(date);
		tempDate.setMinutes(tempDate.getMinutes()+minutes);
		return tempDate;
	}

	static getCurrentDateInMinutes(minutes: number){
		return DateHelper.getDateInMinutes(new Date(), minutes);
	}

	static getSecondsDifference(date1: Date, date2: Date){
		return (date1.getTime()-date2.getTime())/1000;
	}

	static getSecondsToDate(date: Date){
		return DateHelper.getSecondsDifference(date, new Date());
	}

	static formatDateToHHMM(date: Date){
		let hours = date.getHours();
		let minutes = date.getMinutes();
		return DateHelper.formatHoursAndMinutesToHH_MM(hours, minutes);
	}

	private static formatHoursAndMinutesToHH_MM(hours: number, minutes: number){
		let hoursString = hours+"";
		let minutesString = minutes+"";
		if(hours<10){
			hoursString = "0"+hoursString;
		}
		if(minutes<10){
			minutesString = "0"+minutesString;
		}
		return hoursString+":"+minutesString;
	}

	static isDateInFuture(date: Date){
		if(!date){
			return undefined;
		}
		let now = new Date();
		return date>now;
	}

}
