import {Platform} from "react-native";
import {createURL, makeUrl} from 'expo-linking';
import {Navigation} from "../navigation/Navigation";

export class URL_Helper{

    static getURLToBase(){
      if(Platform.OS!=="web"){
          console.log("getURLToBase");
          try{
              console.log("Navigation.DEFAULT_ROUTE_LOGIN: "+Navigation.DEFAULT_ROUTE_LOGIN);
          } catch (err){
              console.log(err)
          }
          try{
              let url = createURL(Navigation.DEFAULT_ROUTE_LOGIN);
              console.log("Linking.createURL: "+url);
              return url;
          } catch (err){
              console.log(err)
          }
          try{
              let url = makeUrl(Navigation.DEFAULT_ROUTE_LOGIN);
              console.log("Linking.makeUrl: "+url);
              return url;
          } catch (err){
              console.log(err)
          }
      } else {
        let fullURL = window.location.href;
        let url = fullURL.split('?')[0];
        url = url.split('#')[0];
        return url;
      }
    }

    static getCurrentLocationWithoutQueryParams(){
      if(Platform.OS!=="web"){
        let url = Linking.createURL("login");
        return url;
      } else {
        return URL_Helper.getLocationWithoutQueryParams(window.location.href);
      }
    }

    static getLocationWithoutQueryParams(url){
        return url.split('?')[0]; //https://stackoverflow.com/questions/5817505/is-there-any-method-to-get-the-url-without-query-string
    }

    // BEWARE ! I disabled lowerCase, this shit wasted me 3h of debugging
    // https://www.sitepoint.com/get-url-parameters-with-javascript/
    static getAllUrlParams(url) {

        // get query string from url (optional) or window
        let queryString = url ? url.split('?')[1] : ""

        // we'll store the parameters here
        let obj = {};

        // if query string exists
        if (queryString) {

            // stuff after # is not part of query string, so get rid of it
            queryString = queryString.split('#')[0];

            // split our query string into its component parts
            let arr = queryString.split('&');

            for (let i = 0; i < arr.length; i++) {
                // separate the keys and the values
                let a = arr[i].split('=');

                // set parameter name and value (use 'true' if empty)
                let paramName = a[0];
                let paramValue = typeof (a[1]) === 'undefined' ? true : a[1];

                // (optional) keep case consistent
                //paramName = paramName.toLowerCase();
                //if (typeof paramValue === 'string') paramValue = paramValue.toLowerCase();

                // if the paramName ends with square brackets, e.g. colors[] or colors[2]
                if (paramName.match(/\[(\d+)?\]$/)) {

                    // create key if it doesn't exist
                    let key = paramName.replace(/\[(\d+)?\]/, '');
                    if (!obj[key]) obj[key] = [];

                    // if it's an indexed array e.g. colors[2]
                    if (paramName.match(/\[\d+\]$/)) {
                        // get the index value and add the entry at the appropriate position
                        let index = /\[(\d+)\]/.exec(paramName)[1];
                        obj[key][index] = paramValue;
                    } else {
                        // otherwise add the value to the end of the array
                        obj[key].push(paramValue);
                    }
                } else {
                    // we're dealing with a string
                    if (!obj[paramName]) {
                        // if it doesn't exist, create property
                        obj[paramName] = paramValue;
                    } else if (obj[paramName] && typeof obj[paramName] === 'string'){
                        // if property does exist and it's a string, convert it to an array
                        obj[paramName] = [obj[paramName]];
                        obj[paramName].push(paramValue);
                    } else {
                        // otherwise add the property
                        obj[paramName].push(paramValue);
                    }
                }
            }
        }

        return obj;
    }

}
