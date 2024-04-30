// The component to handle SSO login links
import {ButtonAuthProvider} from '@/components/buttons/ButtonAuthProvider';
import {ButtonAuthProviderCustom} from '@/components/buttons/ButtonAuthProviderCustom';
import {useEffect, useState} from 'react';
import {AuthProvider, ServerAPI} from '@/helper/database/server/ServerAPI';
import {View} from '@/components/Themed';
import {PlatformHelper} from "@/helper/PlatformHelper";

function isProviderNameEqualTo(provider: AuthProvider, name: string) {
	const lowerCaseName = name.toLowerCase();
	const lowerCaseProviderName = provider.name.toLowerCase();
	return lowerCaseProviderName === lowerCaseName;
}

export const ServerSsoAuthProviders = () => {
	const [authProviders, setAuthProviders] = useState<AuthProvider[] | null>(null);

	useEffect(() => {
		// call anonymous function
		(async () => {
			//console.log("ServerSsoAuthProviders useEffect")
			const remoteAuthProviders = await ServerAPI.getAuthProviders();

			// Sort Apple and Google to the top if the platform is iOS or Android
			const isApple = PlatformHelper.isIOS();
			const isGoogle = PlatformHelper.isAndroid();

			const appleProviderName = 'apple';
			const googleProviderName = 'google';

			// switch apple and google positions depending on platform
			const appleProvider = remoteAuthProviders.find(provider => isProviderNameEqualTo(provider, appleProviderName));
			const googleProvider = remoteAuthProviders.find(provider => isProviderNameEqualTo(provider, googleProviderName));

			if (appleProvider && googleProvider) {
				const appleIndex = remoteAuthProviders.indexOf(appleProvider);
				const googleIndex = remoteAuthProviders.indexOf(googleProvider);


    const smallerIndex = Math.min(appleIndex, googleIndex);
    const biggerIndex = Math.max(appleIndex, googleIndex);

					remoteAuthProviders[smallerIndex] = isGoogle? googleProvider : appleProvider
					remoteAuthProviders[biggerIndex] = isGoogle? appleProvider : googleProvider
			}


			//console.log("ServerSsoAuthProviders useEffect authProviders", remoteAuthProviders)
			setAuthProviders(remoteAuthProviders);
		})()
	}, []);

	if (!authProviders) {
		// loading
		return <ButtonAuthProviderCustom key={'ssoPlaceholder'} accessibilityLabel={'loading'} disabled={true} text={'Loading...'} icon_name={'loading'} />
	}

	const contentRows = [];
	for (const authProvider of authProviders) {
		contentRows.push(
			<View style={{
				width: '100%',
				marginBottom: 8,
			}}
			>
				<ButtonAuthProvider key={authProvider.name} provider={authProvider} />
			</View>
		)
	}

	return (
		<View style={{width: '100%'}}>
			{contentRows}
		</View>
	)
};
