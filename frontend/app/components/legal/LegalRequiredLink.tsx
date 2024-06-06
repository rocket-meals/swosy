import React from 'react';
import {AllRoutes} from 'expo-router';
import {View} from '@/components/Themed';
import {MyLinkDefault} from "@/components/link/MyLinkCustom";

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
