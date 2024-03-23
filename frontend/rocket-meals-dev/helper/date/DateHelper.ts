import {StringHelper} from '@/helper/string/StringHelper';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';

export enum Weekday {
    MONDAY = 'Monday',
    TUESDAY = 'Tuesday',
    WEDNESDAY = 'Wednesday',
    THURSDAY = 'Thursday',
    FRIDAY = 'Friday',
    SATURDAY = 'Saturday',
    SUNDAY = 'Sunday'
}

export class DateHelper {
	static Weekday = Weekday;

	static isWeekend(date: Date) {
		const weekday = date.getDay();
		return weekday === 0 || weekday === 6; // 0 is sunday, 6 is saturday
	}

	static parseTime(time: string, date?: Date): Date {
		const parts = time.split(':');
		const hours = parseInt(parts[0]) || 0;
		const minutes = parseInt(parts[1]) || 0;
		const seconds = parseInt(parts[2]) || 0;
		if (!date) {
			date = new Date(); // create a new date object
		} else {
			date = new Date(date); // clone
		}
		date.setHours(hours);
		date.setMinutes(minutes);
		date.setSeconds(seconds);
		return date;
	}

	static getWeekdayEnumsValues(firstDayOfWeek?: Weekday): Weekday[]{
		const useFirstDayOfWeek = firstDayOfWeek || Weekday.MONDAY;

		const weekOrder = [
			Weekday.SUNDAY,
			Weekday.MONDAY,
			Weekday.TUESDAY,
			Weekday.WEDNESDAY,
			Weekday.THURSDAY,
			Weekday.FRIDAY,
			Weekday.SATURDAY,
		]
		let index = DateHelper.getWeekdayIndex(useFirstDayOfWeek);
		const output = [];
		for (let i=0; i<7; i++) {
			output.push(weekOrder[index]);
			index++;
			if (index >= weekOrder.length) {
				index = 0;
			}
		}
		return output;
	}

	/**
     * Returns the weekday of the given date as a number. It starts with 0 for sunday and ends with 6 for saturday.
     * Calculates modulo 7 to ensure that the number is between 0 and 6.
     * @param weekdayNumber
     */
	static getWeekdayByIndex(weekdayNumber: number): Weekday {
		const modulo = weekdayNumber%7;
		const enumValues = DateHelper.getWeekdayEnumsValues();
		for (let i=0; i<enumValues.length; i++) {
			const weekdayEnum = enumValues[i];
			const weekdayIndex = DateHelper.getWeekdayIndex(weekdayEnum);
			if (weekdayIndex === modulo) {
				return weekdayEnum;
			}
		}
		return Weekday.MONDAY;
	}

	static getWeekdayNames(locale?: string, firstDayOfWeek?: Weekday) {
		const currentWeekDates = DateHelper.getCurrentWeekDates(undefined, firstDayOfWeek);
		const output = [];
		for (const date of currentWeekDates) {
			output.push(DateHelper.getWeekdayNameByDate(date, locale));
		}
		return output;
	}

	static getWeekdayIndex(weekday: Weekday) {
		switch (weekday) {
		case Weekday.SUNDAY: return 0;
		case Weekday.MONDAY: return 1;
		case Weekday.TUESDAY: return 2;
		case Weekday.WEDNESDAY: return 3;
		case Weekday.THURSDAY: return 4;
		case Weekday.FRIDAY: return 5;
		case Weekday.SATURDAY: return 6;
		}
	}

	static getWeekdayDifference(from: Weekday, to: Weekday) {
		const fromIndex = DateHelper.getWeekdayIndex(from);
		const toIndex = DateHelper.getWeekdayIndex(to);
		const difference = toIndex - fromIndex;
		return difference;
	}

	static getWeekdayByDayNumber(dayNumber: number) {
		const enumValues = DateHelper.getWeekdayEnumsValues();
		return enumValues[dayNumber%enumValues.length];
	}

	static getWeekdayToday() {
		return DateHelper.getWeekdayByDate(new Date());
	}

	static getWeekdayByDate(date: Date) {
		const weekdayIndex = date.getDay();
		const weekdayEnums = DateHelper.getWeekdayEnumsValues();
		const indexToWeekdayEnum: {[index: number]: Weekday} = {};
		for (let i=0; i<weekdayEnums.length; i++) {
			const weekdayEnum = weekdayEnums[i];
			const weekdayEnumIndex = DateHelper.getWeekdayIndex(weekdayEnum);
			indexToWeekdayEnum[weekdayEnumIndex] = weekdayEnum;
		}

		return indexToWeekdayEnum[weekdayIndex];
	}

	static getWeekdayNamesFirstLetters(locale?: string, firstDayOfWeek?: Weekday) {
		const weekdayNames = DateHelper.getWeekdayNames(locale, firstDayOfWeek);
		const output = [];
		for (const weekdayName of weekdayNames) {
			output.push(weekdayName[0]);
		}
		return output;
	}

	static getCurrentWeekDates(date?: Date, firstDayOfWeek?: Weekday) {
		const firstDateOfWeek = DateHelper.getFirstDateOfWeek(undefined, firstDayOfWeek);
		const output = [];
		for (let i=0; i<7; i++) {
			output.push(new Date(firstDateOfWeek));
			firstDateOfWeek.setDate(firstDateOfWeek.getDate()+1);
		}
		return output;
	}

	static getWeekdayNameFirstLetter(date: Date, locale?: string) {
		const weekDayName = DateHelper.getWeekdayNameByDate(date, locale);
		if (!!weekDayName && weekDayName.length > 0) {
			return weekDayName[0];
		} else {
			return '?'
		}
	}

	static getDefaultWeekdayDate(weekdayName: Weekday): Date {
		if (!weekdayName) {
			weekdayName = Weekday.MONDAY;
		}

		const date_monday = new Date().setFullYear(1995, 11, 25);
		const date_tuesday = new Date().setFullYear(1995, 11, 26);
		const date_wednesday = new Date().setFullYear(1995, 11, 27);
		const date_thursday = new Date().setFullYear(1995, 11, 28);
		const date_friday = new Date().setFullYear(1995, 11, 29);
		const date_saturday = new Date().setFullYear(1995, 11, 30);
		const date_sunday = new Date().setFullYear(1995, 11, 31);

		switch (weekdayName) {
		case Weekday.MONDAY: return new Date(date_monday);
		case Weekday.TUESDAY: return new Date(date_tuesday);
		case Weekday.WEDNESDAY: return new Date(date_wednesday);
		case Weekday.THURSDAY: return new Date(date_thursday);
		case Weekday.FRIDAY: return new Date(date_friday);
		case Weekday.SATURDAY: return new Date(date_saturday);
		case Weekday.SUNDAY: return new Date(date_sunday);
		default: return DateHelper.getDefaultWeekdayDate(Weekday.MONDAY);
		}
	}

	static getWeekdayTranslationByWeekday(weekdayName: Weekday, locale?: string): string {
		const date = DateHelper.getDefaultWeekdayDate(weekdayName);
		return DateHelper.getWeekdayNameByDate(date, locale);
	}

	static getWeekdayNameByDate(date: Date, locale?: string) {
		if (!locale) {
			locale = 'en-us';
		}
		const weekdayName = date.toLocaleString(locale, { weekday: 'long' })
		return StringHelper.capitalizeFirstLetter(weekdayName);
	}

	static getMonthName(date: Date, locale?: string) {
		if (!locale) {
			locale = 'en-us';
		}
		return date.toLocaleString(locale, { month: 'long' });
	}

	static getAmountDaysFromLastMonthForWeekstart(date: Date, firstDayOfWeek: Weekday) {
		const firstDayOfMonth = DateHelper.getFirstDayOfMonth(date);
		const weekDateOfFirstDayOfMonth = firstDayOfMonth.getDay() // e. G. 6 for thursday
		const firstDayOfWeekIndex = DateHelper.getWeekdayIndex(firstDayOfWeek);
		// firstDayOfWeek e. G. 1 for monday
		// firstDay of month e. G. saturday 01.10.2022
		// weekDateOfFirstDayOfMonth e. G. 6
		// 7+ (6 - 1) = 5
		const diffToStartWithFirstDayOfWeek = (7+(weekDateOfFirstDayOfMonth-firstDayOfWeekIndex))%7
		return diffToStartWithFirstDayOfWeek;
	}

	static getAmountDaysFromNextMonthToWeekend(date: Date, firstDayOfWeek: Weekday) {
		const lastDayOfMonth = DateHelper.getFirstDayOfNextMonth(date);
		const amountDays = DateHelper.getAmountDaysFromLastMonthForWeekstart(lastDayOfMonth, firstDayOfWeek);
		return (7-amountDays);
	}

	static getAmountDaysInMonth(date: Date) {
		const lastDayOfMonth = DateHelper.getLastDayOfMonth(date);
		return lastDayOfMonth.getDate();
	}

	static getLastDayOfMonth(date: Date) {
		const lastDayInMonth = DateHelper.getFirstDayOfNextMonth(date)
		lastDayInMonth.setDate(lastDayInMonth.getDate()-1);
		return lastDayInMonth;
	}

	static getFirstDateOfWeek(date?: Date, firstDayOfWeek?: Weekday) {
		const temp = date ? new Date(date) : new Date();
		const useFirstDayOfWeek = firstDayOfWeek || Weekday.MONDAY;
		let firstDayOfWeekIndex = DateHelper.getWeekdayIndex(useFirstDayOfWeek);
		if (firstDayOfWeek===undefined || firstDayOfWeek === null) {
			firstDayOfWeekIndex = 0;
		}
		const diff = (7+temp.getDay()-firstDayOfWeekIndex)%7
		temp.setDate(temp.getDate()-diff)
		return temp;
	}

	static getFirstDayOfMonth(date: Date) {
		const firstDayOfMonth = new Date(date)
		firstDayOfMonth.setDate(1); // e. G. 01.12.2022
		return firstDayOfMonth
	}

	static getFirstDayOfNextMonth(date: Date) {
		const firstDayOfNextMonth = DateHelper.getFirstDayOfMonth(date);
		firstDayOfNextMonth.setMonth(firstDayOfNextMonth.getMonth()+1);
		return firstDayOfNextMonth;
	}

	static getAmountDaysDifference(biggerDate: Date, smallerDate: Date) {
		const diff = biggerDate.getTime() - smallerDate.getTime();
		return diff/(1000*60*60*24);
	}

	static getDatesOfAmountNextDaysIncludingToday(startDate: Date, amount: number): [Date, Date][] {
		const dates: [Date, Date][] = [];
		let startOfTheDay = new Date(startDate); // copy the date
		let endOfTheDay = new Date(startDate); // copy the date
		startOfTheDay.setHours(0,0,0,0); // so set the start at the beginning of the day
		endOfTheDay.setHours(23,59,59,999); //set to end of day

		const futureDates = amount>0;
		const step = futureDates ? 1 : -1;
		const absAmount = Math.abs(amount);

		for (let i=0; i<absAmount; i++) {
			startOfTheDay = new Date(startOfTheDay.toISOString());
			endOfTheDay = new Date(endOfTheDay.toISOString());

			const dayRange: [Date, Date] = [new Date(startOfTheDay.toISOString()), new Date(endOfTheDay.toISOString())]
			dates.push(dayRange); // push into list

			startOfTheDay.setDate(startOfTheDay.getDate()+step); //add one day
			endOfTheDay.setDate(endOfTheDay.getDate()+step); //add one day
		}

		if (!futureDates) {
			dates.reverse();
		}

		return dates;
	}

	static sortDates(dates: (Date | string)[]) {
		const datesAsDates = [];
		for (const date of dates) {
			if (typeof date==='string') {
				datesAsDates.push(new Date (date));
			} else {
				datesAsDates.push(date);
			}
		}
		datesAsDates.sort((date1, date2) => date1.getTime() - date2.getTime());
		return datesAsDates;
	}

	/**
     * Adds days to a date and returns a new date. Keeps the original date unchanged.
     * @param date
     * @param days
     */
	static addDaysAndReturnNewDate(date: Date, days: number) {
		const tempDate = new Date(date);
		tempDate.setDate(tempDate.getDate()+days);
		return tempDate;
	}

	static addMinutes(date: Date, minutes: number) {
		const tempDate = new Date(date);
		tempDate.setMinutes(tempDate.getMinutes()+minutes);
		return tempDate;
	}

	static addDays(date: Date, days: number) {
		// use addMinutes
		const totalMinutesToAdd = days*24*60;
		return DateHelper.addMinutes(date, totalMinutesToAdd);
	}

	static formatToOfferDate(date: Date) {
		const iso = date.toISOString();
		const trimmed = iso.slice(0, 'YYYY-MM-DD'.length);
		return trimmed;
	}

	static isSameDay(date1: Date, date2: Date) {
		return date1.toDateString() === date2.toDateString();
	}

	// returns "Yesterday", "Today", "Tomorrow", or "Tuesday", "Wednesday" or the date in the format "DD.MM.YYYY"
	static useSmartReadableDate(date: Date, locale?: string) {
		const dateCopy = new Date(date); // since the original date may be changed during the process of other functions we need to copy it in order have a reliable date
		//console.log("useSmartReadableDate", dateCopy, locale)
		const today = new Date();
		const tomorrow = DateHelper.addDaysAndReturnNewDate(today, 1);
		const yesterday = DateHelper.addDaysAndReturnNewDate(today, -1);

		const translationToday = useTranslation(TranslationKeys.today);
		const translationTomorrow = useTranslation(TranslationKeys.tomorrow);
		const translationYesterday = useTranslation(TranslationKeys.yesterday);

		//console.log("check if date is today, then return 'today'", today, dateCopy)
		// check if date is today, then return "today"
		if (DateHelper.isSameDay(today, dateCopy)) {
			return translationToday;
		}

		// check if date is tomorrow, then return "tomorrow"
		if (DateHelper.isSameDay(tomorrow, dateCopy)) {
			return translationTomorrow;
		}
		// check if date is yesterday, then return "yesterday"

		if (DateHelper.isSameDay(yesterday, dateCopy)) {
			return translationYesterday;
		}

		const oneWeekLater = DateHelper.addDaysAndReturnNewDate(today, 6);
		if (dateCopy >= yesterday && dateCopy <= oneWeekLater) {
			return DateHelper.getWeekdayNameByDate(dateCopy, locale);
		}
		// else return "01.01.2021"
		return DateHelper.formatOfferDateToReadable(dateCopy, false, false);
	}

	static formatOfferDateToReadable(offerDate: Date, withYear?: boolean, withTime?: boolean) {
		let date = offerDate;
		if (!offerDate) {
			date = new Date();
		}
		if (typeof offerDate==='string') {
			date = new Date(offerDate);
		}
		const iso = date.toISOString();
		const trimmed = iso.slice(0, 'YYYY-MM-DD'.length);
		const splits = trimmed.split('-');
		const years = splits[0];
		const month = splits[1];
		const days = splits[2];

		let firstPart = '';
		const hours = date.getHours();
		const minutes = date.getMinutes();
		if (withTime) {
			const hoursWithPad = hours < 10 ? '0'+hours : hours;
			const minutesWithPad = minutes < 10 ? '0'+minutes : minutes;
			firstPart = hoursWithPad+':'+minutesWithPad+' ';
		}

		firstPart+=days+'.'+month+'.'
		if (withYear) {
			return firstPart+years;
		} else {
			return firstPart;
		}
	}

	static formatMinutesToReadable(minutes: number) {
		const hours = Math.floor(minutes/60);
		const minutesLeft = minutes%60;
		const readable = DateHelper.formatHoursAndMinutesToHH_MM(hours, minutesLeft);
		return readable+' h';
	}

	static getDateInMinutes(date: Date, minutes: number) {
		const tempDate = new Date(date);
		tempDate.setMinutes(tempDate.getMinutes()+minutes);
		return tempDate;
	}

	static getCurrentDateInMinutes(minutes: number) {
		return DateHelper.getDateInMinutes(new Date(), minutes);
	}

	static getSecondsDifference(date1: Date, date2: Date) {
		return (date1.getTime()-date2.getTime())/1000;
	}

	static getSecondsToDate(date: Date) {
		return DateHelper.getSecondsDifference(date, new Date());
	}

	static formatDateToHHMM(date: Date) {
		const hours = date.getHours();
		const minutes = date.getMinutes();
		return DateHelper.formatHoursAndMinutesToHH_MM(hours, minutes);
	}

	private static formatHoursAndMinutesToHH_MM(hours: number, minutes: number) {
		let hoursString = hours+'';
		let minutesString = minutes+'';
		if (hours<10) {
			hoursString = '0'+hoursString;
		}
		if (minutes<10) {
			minutesString = '0'+minutesString;
		}
		return hoursString+':'+minutesString;
	}

	static isDateInFuture(date: Date) {
		if (!date) {
			return undefined;
		}
		const now = new Date();
		return date>now;
	}
}
