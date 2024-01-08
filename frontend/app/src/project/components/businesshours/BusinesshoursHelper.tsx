import {Businesshours} from "../../directusTypes/types";

export class BusinesshoursHelper{

	static getWeekdayNameKeys(){
		return [
			"Monday",
			"Tuesday",
			"Wednesday",
			"Thursday",
			"Friday",
			"Saturday",
			"Sunday"
		]
	}

	static sortBusinesshours(businesshoursList: Businesshours[]): Businesshours[]{
		return businesshoursList.sort((a, b) => {
			return a.time_start.localeCompare(b.time_start);
		});
	}

	// merge list of businesshours into one a week overview
	static getWeekOverview(businesshoursList: Businesshours[]): Record<string, Businesshours[]>{
		let weekOverview = {};
		for(const dayOfWeek of this.getWeekdayNameKeys()){
			weekOverview[dayOfWeek] = [];
		}

		// sort businesshours by day of week
		for(let businesshours of businesshoursList){
			const dayOfTheWeek = businesshours?.dayOfTheWeek;
			let businesshoursForDay = weekOverview[dayOfTheWeek];
			businesshoursForDay.push(businesshours);
			weekOverview[dayOfTheWeek] = businesshoursForDay;
		}

		// sort businesshours for each day
		for(const dayOfWeek of this.getWeekdayNameKeys()){
			weekOverview[dayOfWeek] = this.sortBusinesshours(weekOverview[dayOfWeek]);
		}

		return weekOverview;
	}

	static getWeekdayName(){

	}

	static formatBusinesshours(timeString: string): string{
		if(!!timeString){
			// timeString is in format "HH:mm:ss"
			const timeStringParts = timeString.split(":");
			const hours = timeStringParts[0];
			const minutes = timeStringParts[1];
			const seconds = timeStringParts[2];
			return hours+":"+minutes;
		} else {
			return null
		}
	}
}
