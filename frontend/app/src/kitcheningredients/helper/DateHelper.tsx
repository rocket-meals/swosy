import React from "react";
import {StringHelper} from "./StringHelper";

export class DateHelper {

	static formatDateToReadable(offerDate, withYear?, withTime?){
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

}
