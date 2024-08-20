import {StringHelper} from "@/helper/string/StringHelper";

export class NumberHelper {
//https://helloacm.com/javascripts-tofixed-implementation-without-rounding/#:~:text=The%20idea%20is%20to%20convert,for%20exactly%20n%20decimal%20places.
	static toFixedNoRounding(number: number, fractions: number) {
		const reg = new RegExp("^-?\\d+(?:\\.\\d{0," + fractions + "})?", "g")
		const a = number.toString().match(reg)?.[0];
		const dot = a?.indexOf(".");
		if (dot === -1) { // integer, insert decimal dot and pad up zeros
			return a + "." + "0".repeat(fractions);
		}
		const b = fractions - (a.length - dot) + 1;
		return b > 0 ? (a + "0".repeat(b)) : a;
	}

	static formatNumber(value: number | undefined | null, unit: string | null | undefined, roundUpOrDown: boolean, fractionsSeparator: string | undefined, thousandsSeparator: string | null, amountDecimals: number | undefined): string {
		//TODO? What about different currencies? Should we transform/calculate it?
		let usedSuffix = "";
		if(unit){
			usedSuffix = StringHelper.NONBREAKING_SPACE+unit;
		}

		let usedAmountDecimals = 2
		if(amountDecimals !== undefined){
			usedAmountDecimals = amountDecimals;
		}

		if(value===undefined || value===null){
			return "?"+usedSuffix;
		}
		//Since Intl.NumberFormat does not work on android, we need to do it ourself
		try{
			let priceWithFraction = value.toFixed(usedAmountDecimals);
			if(!roundUpOrDown){
				priceWithFraction = ""+NumberHelper.toFixedNoRounding(value, usedAmountDecimals);
			}
			if(!fractionsSeparator){
				fractionsSeparator = ",";
			}
			priceWithFraction = priceWithFraction.replace(".", fractionsSeparator);

			if(thousandsSeparator){
				const [integerPart, fractionPart] = priceWithFraction.split(fractionsSeparator);

				const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);

				priceWithFraction = fractionPart
					? formattedInteger + fractionsSeparator + fractionPart
					: formattedInteger;
			}
			return priceWithFraction+usedSuffix;
		} catch (err){
			//console.log(err);
		}
		return value+"";
	}
}
