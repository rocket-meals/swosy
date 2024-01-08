// @ts-nocheck
import React from 'react';
import {Navigation} from "./Navigation";
import {NavigatorHelper} from "./NavigatorHelper";

export const NavigationHistorySetter = (props) => {

  const [history, setHistory] = Navigation.useNavigationHistory();
  if (!NavigatorHelper.setNavigationHistory) {
    NavigatorHelper.setSetNavigationHistoryFunction(setHistory);
  }

  return null;
}
