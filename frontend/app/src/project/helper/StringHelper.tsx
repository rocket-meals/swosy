import {Text, View} from "native-base";
import React from "react";

export class StringHelper {

	static EMPTY_SPACE = "\u200b"
	static NONBREAKING_SPACE = "\u00a0"

	static renderZeroSpaceHeight(amount?: number){
		if(amount===undefined){
			amount=1;
		}

		let content = [];
		for(let i=0; i<amount; i++){
			content.push(<Text key={"zeroSpace_"+i}>{StringHelper.EMPTY_SPACE}</Text>);
		}

		return(
			<View style={{flexDirection: "column"}}>
				{content}
			</View>
		)
	}

	static getNameOfTypeObject(obj){
		return Object.keys(obj)[0];
	}

	static getUnderScoreNameOfTypeObject(obj){
		return StringHelper.pascalCaseToUnder_Score(StringHelper.getNameOfTypeObject(obj));
	}

	//https://stackoverflow.com/questions/30521224/javascript-convert-pascalcase-to-underscore-case-snake-case
	static pascalCaseToUnder_Score(str: string){
		return str.split(/(?=[A-Z])/).join('_').toLowerCase();
	}

	static replaceAll(str, find, replace) {
		return str.replace(new RegExp(find, 'g'), replace);
	}

	static replaceAllLineBreaks(str, replace?){
		if(replace===undefined){
			replace = "";
		}
		let current = str;
		let toReplace = ["\r", "\n"]
		for(let i=0; i<toReplace.length; i++){
			let find = toReplace[i];
			current = StringHelper.replaceAll(current, find, replace);
		}
		return current;
	}

	static capitalizeFirstLetter(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}

	static enableReplaceAllOnOldDevices(){
		if(typeof String.prototype.replaceAll === "undefined") {
			String.prototype.replaceAll = function(match, replace) {
				return this.replace(new RegExp(match, 'g'), () => replace);
			}
		}
	}

}
