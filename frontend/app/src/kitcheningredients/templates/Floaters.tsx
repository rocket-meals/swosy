// @ts-nocheck
import React from 'react';
import CustomFloaters from "./CustomFloaters";
import {ThemeFloaterButton} from "./ThemeFloaterButton";
import {ConfigHolder} from "./../ConfigHolder";

//TODO: https://docs.nativebase.io/stagger
export const Floaters = () => {

  let themeFloaterButton = null;
  if(ConfigHolder.displayThemeFloater){
    themeFloaterButton = <ThemeFloaterButton key={"ThemeFloater"} />;
  }


	const renderedContent = [
		themeFloaterButton,
		...CustomFloaters.getFloaters()
	];

	return (
		<>
			{renderedContent}
		</>
	);
};
