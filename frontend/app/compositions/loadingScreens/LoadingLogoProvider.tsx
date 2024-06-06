import React, {createContext, useContext, useEffect, useState} from 'react';
import {useProjectLogoAssetId} from "@/states/ProjectInfo";
import {ProjectLogo} from "@/components/project/ProjectLogo";

const LoadingLogoContext = createContext(undefined);

export const LoadingLogoProvider = ({children,...props}) => {
	const [logo, setLogo] = useState(null);

	const height = props.height || 200;
	const width = props.width || 200;

	const projectLogoAssetId = useProjectLogoAssetId()

	useEffect(() => {
		// Load the remote image
		setLogo(<ProjectLogo key={projectLogoAssetId} style={{width: width, height: height}}/>);
	}, [projectLogoAssetId]);

	return (
		<LoadingLogoContext.Provider value={logo}>
			{children}
		</LoadingLogoContext.Provider>
	);
}

export const useLoadingLogo = () => useContext(LoadingLogoContext);