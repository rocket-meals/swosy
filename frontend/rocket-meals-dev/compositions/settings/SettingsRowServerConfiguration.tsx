import React, {FunctionComponent} from 'react';
import {SettingsRowActionsheet} from '@/components/settings/SettingsRowActionsheet';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {IconNames} from '@/constants/IconNames';
import {useLogoutCallback} from '@/states/User';
import {ServerAPI} from '@/helper/database/server/ServerAPI';
import ServerConfiguration from '@/constants/ServerConfiguration';

interface AppState {

}
export const SettingsRowServerConfiguration: FunctionComponent<AppState> = ({...props}) => {
	const logout = useLogoutCallback()

	const leftIcon = IconNames.server_icon

	const title = 'Server Configuration'

	const translation_select = useTranslation(TranslationKeys.select)

	const translation_edit = useTranslation(TranslationKeys.edit)

    enum ServerConfigurationsOptions {
        System = 'system',
        RocketMeals = 'rocketmeals',
        SWOSY = 'swosy',
        StudiFutter = 'studifutter',
        LocalHost = 'localhost'
    }

    const optionKeyToName: {[key in ServerConfigurationsOptions]: string}
        = {
        	[ServerConfigurationsOptions.System]: 'System',
        	[ServerConfigurationsOptions.RocketMeals]: 'Rocket-Meals',
        	[ServerConfigurationsOptions.SWOSY]: 'SWOSY',
        	[ServerConfigurationsOptions.StudiFutter]: 'Studi|Futter',
        	[ServerConfigurationsOptions.LocalHost]: 'http://127.0.0.1/rocket-meals/api'
        }

    const optionKeyToUrl: {[key in ServerConfigurationsOptions]: string}
        = {
        	[ServerConfigurationsOptions.System]: ServerConfiguration.ServerUrl,
        	[ServerConfigurationsOptions.RocketMeals]: 'https://rocket-meals.de/demo/api',
        	[ServerConfigurationsOptions.SWOSY]: 'https://swosy.rocket-meals.de/rocket-meals/api',
        	[ServerConfigurationsOptions.StudiFutter]: 'https://studi-futter.rocket-meals.de/rocket-meals/api',
        	[ServerConfigurationsOptions.LocalHost]: 'http://127.0.0.1/rocket-meals/api'
        }

    let selectedName = optionKeyToName[ServerConfigurationsOptions.System]
    const activeUrl = ServerAPI.getServerUrl()

    const availableOptionKeys = Object.keys(optionKeyToName) as ServerConfigurationsOptions[]
    // check which server is selected by the url so iterate over all optionKeyToUrl and check if the url is the same
    for (const key in optionKeyToUrl) {
    	if (optionKeyToUrl[key as ServerConfigurationsOptions] === activeUrl) {
    		selectedName = optionKeyToName[key as ServerConfigurationsOptions]
    	}
    }

    const accessibilityLabel = translation_edit+': '+title + ' ' + selectedName
    const label = title

    const items = []

    for (const key of availableOptionKeys) {
    	const label: string = optionKeyToName[key]

    	const nextUrl = optionKeyToUrl[key as ServerConfigurationsOptions]
    	const active = nextUrl === activeUrl

    	const itemAccessibilityLabel = label+' '+translation_select

    	items.push({
    		key: key as string,
    		label: label,
    		active: active,
    		accessibilityLabel: itemAccessibilityLabel,
    		onSelect: async (key: string, hide: () => void) => {
    			console.log('Selected Server Configuration', key, nextUrl)
    			ServerAPI.serverUrlCustom = nextUrl
    			console.log('Selected Server Configuration', ServerAPI.getServerUrl())
    			logout()
    		}
    	})
    }

    const config = {
    	onCancel: undefined,
    	visible: true,
    	title: title,
    	items: items
    }

    return (
    	<>
    		<SettingsRowActionsheet labelRight={selectedName} labelLeft={label} config={config} accessibilityLabel={accessibilityLabel} leftContent={label} leftIcon={leftIcon} {...props}  />
    	</>
    )
}
