import React from 'react';
import {AllRoutes, router} from 'expo-router';
import {Text, View} from '@/components/Themed';
import {MyTouchableOpacity} from '@/components/buttons/MyTouchableOpacity';
import {MyLinkCustom, MyLinkDefault} from "@/components/link/MyLinkCustom";

export type LegalRequiredInternalLinkProps = {
	externalHref?: string | null | undefined,
    internalHref: AllRoutes,
    text: string,
}
export const LegalRequiredLink = (props: LegalRequiredInternalLinkProps) => {

	return (
		<View style={{flexDirection: 'row'}}>
			<MyLinkDefault routeInternal={props.internalHref} hrefExternal={props?.externalHref} accessibilityLabel={props.text} label={props.text} />
		</View>
	)
}
