import {Text, View} from "native-base";
import React from "react";

export class StringHelper{

  static EMPTY_SPACE = "\u200b"
  static NONBREAKING_SPACE = "\u00a0"

  static renderZeroSpaceHeight(amount?: number){
    if(amount===undefined){
      amount=1;
    }

    let content = [];
    for(let i=0; i<amount; i++){
      // @ts-ignore
      content.push(<Text key={"zeroSpace_"+i}>{StringHelper.EMPTY_SPACE}</Text>);
    }

    return(
      // @ts-ignore
      <View style={{flexDirection: "column"}}>
        {content}
      </View>
    )
  }

  /**
   * Converts CamelCase to kebab-case
   * https://stackoverflow.com/questions/63116039/camelcase-to-kebab-case-in-javascript
   * @param str
   * @returns {*}
   */
  static kebabize(str){
    return str.replace(/[A-Z]+(?![a-z])|[A-Z]/g, ($, ofs) => (ofs ? "-" : "") + $.toLowerCase())
  }

  static toCapitalizedWords(name) {
    const words = name.match(/[A-Za-z][a-z]*/g) || [];
    return words.map(StringHelper.capitalizeFirstLetter).join(" ");
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
