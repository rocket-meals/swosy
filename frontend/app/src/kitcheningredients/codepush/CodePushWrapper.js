// @ts-nocheck
import React from 'react'
import {Text, TouchableOpacity, View} from 'react-native'

//import codePush from 'react-native-code-push'
const codePush = {};

import App from '../App'
import ColorCodeHelper from "../theme/ColorCodeHelper";
import * as SplashScreen from 'expo-splash-screen';

export class CodePushWrapper extends React.Component {
    static isSyncingFinished(status) {
        return (
          status === codePush?.SyncStatus.CHECKING_FOR_UPDATE ||
            status === codePush?.SyncStatus.UP_TO_DATE ||
            status === codePush?.SyncStatus.UPDATE_INSTALLED
        )
    }

    static getStatusMessage(status) {
        switch (status) {
            case codePush?.SyncStatus.CHECKING_FOR_UPDATE:
                return 'Checking for updates.'
            case codePush?.SyncStatus.DOWNLOADING_PACKAGE:
                return 'Downloading package.'
            case codePush?.SyncStatus.INSTALLING_UPDATE:
                return 'Installing update.'
            case codePush?.SyncStatus.UP_TO_DATE:
                return 'Up-to-date.'
            case codePush?.SyncStatus.UPDATE_INSTALLED:
                return 'Update installed.'
            default:
                return `Unkown Status: ${status}`
        }
    }

    constructor(props) {
        super(props)
        this.placeholder = 'placeholder'
        this.state = {
            status: codePush?.SyncStatus?.CHECKING_FOR_UPDATE,
            receivedBytes: 0,
            totalBytes: 0,
            initialColorMode: null,
        }
    }

    async componentDidMount() {
        let initialColorMode = await ColorCodeHelper.getColorModeFromStorage();
        await this.setState({
            initialColorMode: initialColorMode
        });
        SplashScreen.hideAsync();
    }

    async setStatus(status) {
        console.log(CodePushWrapper.getStatusMessage(status))
        await this.setState({
            status,
        })
    }

    /**
     * Implementing
     * https://github.com/microsoft/react-native-code-push/blob/master/docs/api-js.md
     */
    async codePushStatusDidChange(status) {
        await this.setStatus(status)
    }

    /**
     * Implementing
     * https://github.com/microsoft/react-native-code-push/blob/master/docs/api-js.md
     */
    async codePushDownloadDidProgress(progress) {
        const { receivedBytes } = progress
        const { totalBytes } = progress
        console.log(`${receivedBytes} of ${totalBytes} received.`)
        await this.setState({
            receivedBytes,
            totalBytes,
        })
    }

    renderDownloadProgress() {
        return (
            <View style={{flex: 1, alignItems: "center", justifyContent: "center"}}>
                    <TouchableOpacity
                        style={{
                            backgroundColor: 'lightblue',
                            borderRadius: 20,
                            alignItems: 'center',
                            margin: 20,
                            padding: 20,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 24,
                                fontWeight: '600',
                                color: 'black',
                            }}
                        >
                            {'Status:\n'}
                            {CodePushWrapper.getStatusMessage(this.state.status)}
                        </Text>
                        <Text
                            style={{
                                fontSize: 18,
                                fontWeight: '600',
                                color: 'black',
                            }}
                        >
                            {'Download Progress:\n'}
                            {`${this.state.receivedBytes} / ${this.state.totalBytes} Bytes`}
                        </Text>
                    </TouchableOpacity>
                </View>
        )
    }

    render() {
        if (CodePushWrapper.isSyncingFinished(this.state.status) && !!this.state.initialColorMode) {
            return <App initialColorMode={this.state.initialColorMode} />
        } else {
            return <App initialColorMode={this.state.initialColorMode} >
                {this.renderDownloadProgress()}
            </App>
        }
    }
}
