import {Text, View} from '@/components/Themed';

export class StringHelper {
	static EMPTY_SPACE = '\u200b'
	static NONBREAKING_SPACE = '\u00a0'
	static NONBREAKING_HALF_SPACE = '\u202f'; // Half space non-breaking

	static renderZeroSpaceHeight(amount?: number) {
		if (amount===undefined) {
			amount=1;
		}

		const content = [];
		for (let i=0; i<amount; i++) {
			content.push(<Text key={'zeroSpace_'+i}>{StringHelper.EMPTY_SPACE}</Text>);
		}

		return (
			<View style={{flexDirection: 'column'}}>
				{content}
			</View>
		)
	}

	static getLevenshteinDistance(a: string, b: string): number {
		if(a.length == 0) return b.length;
		if(b.length == 0) return a.length;

		var matrix = [];

		// increment along the first column of each row
		var i;
		for(i = 0; i <= b.length; i++){
			matrix[i] = [i];
		}

		// increment each column in the first row
		var j;
		for(j = 0; j <= a.length; j++){
			matrix[0][j] = j;
		}

		// Fill in the rest of the matrix
		for(i = 1; i <= b.length; i++){
			for(j = 1; j <= a.length; j++){
				if(b.charAt(i-1) == a.charAt(j-1)){
					matrix[i][j] = matrix[i-1][j-1];
				} else {
					matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, // substitution
						Math.min(matrix[i][j-1] + 1, // insertion
							matrix[i-1][j] + 1)); // deletion
				}
			}
		}

		return matrix[b.length][a.length];
	}

	//https://stackoverflow.com/questions/30521224/javascript-convert-pascalcase-to-underscore-case-snake-case
	static pascalCaseToUnder_Score(str: string) {
		return str.split(/(?=[A-Z])/).join('_').toLowerCase();
	}

	static replaceAll(str: string, find: string, replace: string) {
		return str.replace(new RegExp(find, 'g'), replace);
	}

	static replaceAllLineBreaks(str: string, replace?: string) {
		if (replace===undefined) {
			replace = '';
		}
		let current = str;
		const toReplace = ['\r', '\n']
		for (let i=0; i<toReplace.length; i++) {
			const find = toReplace[i];
			current = StringHelper.replaceAll(current, find, replace);
		}
		return current;
	}

	static capitalizeFirstLetter(string: string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}

	static enableReplaceAllOnOldDevices() {
		if (typeof String.prototype.replaceAll === 'undefined') {
			String.prototype.replaceAll = function(match, replace: any) {
				return this.replace(new RegExp(match, 'g'), () => replace);
			}
		}
	}

	static isNumber(value: string) {
		return !isNaN(Number(value));
	}
}
