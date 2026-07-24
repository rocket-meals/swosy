// AsyncStorage has no native module in the jest environment - use the official mock.
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

// react-native-webview requires a native module that does not exist in jest - render a plain View instead.
jest.mock('react-native-webview', () => {
	const React = require('react');
	const { View } = require('react-native');
	const WebView = props => React.createElement(View, props);
	return { __esModule: true, WebView, default: WebView };
});
