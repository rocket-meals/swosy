import React, { createContext, ReactNode, useContext, useMemo } from 'react';

export type SettingsContextType = {
	primaryColor: string;
	onAccountRequired?: () => void;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

type SettingsProviderProps = {
	primaryColor: string;
	onAccountRequired?: () => void;
	children: ReactNode;
};

export const SettingsProvider = ({ primaryColor, onAccountRequired, children }: SettingsProviderProps) => {
	const value = useMemo(
		() => ({ primaryColor, onAccountRequired }),
		[primaryColor, onAccountRequired]
	);
	return (
		<SettingsContext.Provider value={value}>
			{children}
		</SettingsContext.Provider>
	);
};

export const useSettingsContext = (): SettingsContextType | undefined => {
	return useContext(SettingsContext);
};
