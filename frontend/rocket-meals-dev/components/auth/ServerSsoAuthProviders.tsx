// The component to handle SSO login links
import {ButtonAuthProvider} from "@/components/buttons/ButtonAuthProvider";
import {ButtonAuthProviderCustom} from "@/components/buttons/ButtonAuthProviderCustom";
import {useEffect, useState} from "react";
import {AuthProvider, ServerAPI} from "@/helper/database_helper/server/ServerAPI";
import {View} from "@/components/Themed";

export const ServerSsoAuthProviders = () => {

    const [authProviders, setAuthProviders] = useState<AuthProvider[] | null>(null);

    useEffect(() => {
        // call anonymous function
        (async () => {
            console.log("ServerSsoAuthProviders useEffect")
            let remoteAuthProviders = await ServerAPI.getAuthProviders();
            console.log("ServerSsoAuthProviders useEffect authProviders", remoteAuthProviders)
            setAuthProviders(remoteAuthProviders);
        })()
    }, []);

    if(!authProviders) {
        // loading
        return <ButtonAuthProviderCustom accessibilityLabel={"loading"} disabled={true} text={"Loading..."} icon_name={"loading"} />
    }

    let contentRows = [];
    for(let authProvider of authProviders) {
        contentRows.push(
            <ButtonAuthProvider key={authProvider.name} provider={authProvider} />
        )
        contentRows.push(
            <View style={{height: 10}} key={authProvider.name+"spacer"} />
        )
    }

    return(
        contentRows
    )

};
