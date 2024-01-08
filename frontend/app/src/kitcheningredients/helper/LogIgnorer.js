// @ts-nocheck
import React from 'react';
import {LogBox} from "react-native";

export default class LogIgnorer extends React.Component {

	static ignoreLogs(patterns){
		if(!!LogBox){
			LogBox.ignoreLogs([
				'Warning: isMounted(...) is deprecated', // works
				'Module RCTImageLoader', // works
				'Require cycle:', // doesn't work
			])
		}
	}

}
