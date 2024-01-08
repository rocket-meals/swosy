// @ts-nocheck
import React from "react";
import {LoremIpsum} from "lorem-ipsum";
// const LoremIpsum = require("lorem-ipsum").LoremIpsum;

const lorem = new LoremIpsum({
	sentencesPerParagraph: {
		max: 8,
		min: 4
	},
	wordsPerSentence: {
		max: 16,
		min: 4
	}
});

export default class TextGenerator{

	static generateTextLong(){
		let output = "";
		for(let i=1; i<10; i++){ //chapters
			output += i+": "+lorem.generateWords(2); //title
			output += lorem.getLineEnding();
			output += " ";
			output += lorem.getLineEnding();
			output += lorem.generateParagraphs(14);
			output += lorem.getLineEnding();
			output += " ";
			output += lorem.getLineEnding();
			output += " ";
			output += lorem.getLineEnding();
		}
		return output
	}

}
