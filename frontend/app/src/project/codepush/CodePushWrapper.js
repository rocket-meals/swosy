// @ts-nocheck
import React from 'react'
import {App} from '../../kitcheningredients'
import * as SplashScreen from 'expo-splash-screen';
import {UpdateScreen} from "./UpdateScreen";
import {CodePushValues} from "./CodePushValues";

export class CodePushWrapper extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            status: CodePushValues.SyncStatus.CHECKING_FOR_UPDATE,
            receivedBytes: 0,
            totalBytes: 0,
            initialColorMode: null,
        }
    }

    async componentDidMount() {
        let initialColorMode = "dark";
        await this.setState({
            initialColorMode: initialColorMode
        });
        try{
            SplashScreen.hideAsync();
        } catch (err){
            //console.log("Already hidden");
        }
    }

    async setStatus(status) {
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
        await this.setState({
            receivedBytes,
            totalBytes,
        })
    }

    render() {
        if (CodePushValues.isSyncingFinished(this.state.status) && !!this.state.initialColorMode) {
            return <App initialColorMode={this.state.initialColorMode} />
        } else {
            return <App initialColorMode={this.state.initialColorMode} >
                <UpdateScreen receivedBytes={this.state.receivedBytes} totalBytes={this.state.totalBytes} status={this.state.status} initialColorMode={this.state.initialColorMode} />
            </App>
        }
    }
}
