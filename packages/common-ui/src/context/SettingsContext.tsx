import React, { createContext, ReactNode, useContext } from 'react';

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

export const SettingsProvider = ({ primaryColor, onAccountRequired, children }: SettingsProviderProps) => (
	<SettingsContext.Provider value={{ primaryColor, onAccountRequired }}>
		{children}
	</SettingsContext.Provider>
);

export const useSettingsContext = (): SettingsContextType | undefined => {
	return useContext(SettingsContext);
};
