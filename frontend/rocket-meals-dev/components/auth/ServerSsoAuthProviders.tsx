// The component to handle SSO login links
import {ButtonAuthProvider} from '@/components/buttons/ButtonAuthProvider';
import {ButtonAuthProviderCustom} from '@/components/buttons/ButtonAuthProviderCustom';
import {useEffect, useState} from 'react';
import {AuthProvider, ServerAPI} from '@/helper/database/server/ServerAPI';
import {View} from '@/components/Themed';

export const ServerSsoAuthProviders = () => {
	const [authProviders, setAuthProviders] = useState<AuthProvider[] | null>(null);

	useEffect(() => {
		// call anonymous function
		(async () => {
			//console.log("ServerSsoAuthProviders useEffect")
			const remoteAuthProviders = await ServerAPI.getAuthProviders();
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
