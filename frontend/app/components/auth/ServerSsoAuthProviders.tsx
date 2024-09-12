// The component to handle SSO login links
import {ButtonAuthProvider} from '@/components/buttons/ButtonAuthProvider';
import {ButtonAuthProviderCustom} from '@/components/buttons/ButtonAuthProviderCustom';
import {useEffect, useState} from 'react';
import {AuthProvider, ServerAPI} from '@/helper/database/server/ServerAPI';
import {View} from '@/components/Themed';
import {PlatformHelper} from "@/helper/PlatformHelper";
import {useIsDemo} from "@/states/SynchedDemo";

function isProviderNameEqualTo(provider: AuthProvider, name: string) {
	const lowerCaseName = name.toLowerCase();
	const lowerCaseProviderName = provider.name.toLowerCase();
	return lowerCaseProviderName === lowerCaseName;
}

// Define the type for Single Sign-On (SSO) providers
type ServerSsoAuthProvidersProps = {
	onSuccess?: (token: string) => void,
	onError?: (error: any) => void,
	privacyPolicyAccepted?: boolean,
	onPressWhenPrivacyPolicyIsNotAccepted?: (() => void | Promise<void>) | undefined,
}

export const ServerSsoAuthProviders = ({ onPressWhenPrivacyPolicyIsNotAccepted, privacyPolicyAccepted, onError, onSuccess }: ServerSsoAuthProvidersProps) => {
	const [authProviders, setAuthProviders] = useState<AuthProvider[] | null>(null);
	const isDemo = useIsDemo()

	useEffect(() => {
		// call anonymous function
		(async () => {
			//console.log("ServerSsoAuthProviders useEffect")
			const remoteAuthProviders = await ServerAPI.getAuthProviders(isDemo);

			console.log("remoteAuthProviders");
			console.log(remoteAuthProviders);


			// Sort Apple and Google to the top if the platform is iOS or Android
			const isApple = PlatformHelper.isIOS();
			const isGoogle = PlatformHelper.isAndroid()

			// switch apple and google positions depending on platform
			const appleProvider = remoteAuthProviders.find(provider => isProviderNameEqualTo(provider, ServerAPI.PROVIDER_NAME_APPLE));
			const googleProvider = remoteAuthProviders.find(provider => isProviderNameEqualTo(provider, ServerAPI.PROVIDER_NAME_GOOGLE));

			if (appleProvider && googleProvider) {
					const appleIndex = remoteAuthProviders.indexOf(appleProvider);
					const googleIndex = remoteAuthProviders.indexOf(googleProvider);

					const smallerIndex = Math.min(appleIndex, googleIndex);
					const biggerIndex = Math.max(appleIndex, googleIndex);

					if(isApple){
						remoteAuthProviders[smallerIndex] = appleProvider
						remoteAuthProviders[biggerIndex] = googleProvider
					}
					if(isGoogle){
						remoteAuthProviders[smallerIndex] = googleProvider
						remoteAuthProviders[biggerIndex] = appleProvider
					}
			}


			//console.log("ServerSsoAuthProviders useEffect authProviders", remoteAuthProviders)
			setAuthProviders(remoteAuthProviders);
		})()
	}, []);

	const PADDING_BETWEEN_AUTH_PROVIDERS = 8;

	const renderedAuthProviders = [];

	if (!authProviders) {
		// loading
		renderedAuthProviders.push(
			<ButtonAuthProviderCustom key={'ssoPlaceholder'} accessibilityLabel={'loading'} disabled={true} text={'Loading...'} icon_name={'loading'} />
		)
	} else {
		for (const authProvider of authProviders) {
			renderedAuthProviders.push(
				<ButtonAuthProvider onPressWhenPrivacyPolicyIsNotAccepted={onPressWhenPrivacyPolicyIsNotAccepted} privacyPolicyAccepted={privacyPolicyAccepted} onSuccess={onSuccess} onError={onError} key={authProvider.name} provider={authProvider} />
			)
		}
	}

	const paddedAuthProviders: any[] = [];
	for(let row of renderedAuthProviders){
		paddedAuthProviders.push(
			<View style={{
				width: '100%',
				marginBottom: PADDING_BETWEEN_AUTH_PROVIDERS,
			}}
			>
				{row}
			</View>
		)
	}

	return (
		<View style={{width: '100%'}}>
			{paddedAuthProviders}
		</View>
	)
};
