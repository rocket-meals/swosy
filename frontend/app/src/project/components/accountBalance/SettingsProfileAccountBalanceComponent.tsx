// @ts-nocheck
import React, {FunctionComponent} from "react";
import {useAppTranslation} from "../translations/AppTranslation";
import {getAccountBalanceVisiblity, useAccountBalance} from "./AccountBalanceHelper";
import {useFormatedPrice} from "../food/FormatedPriceText";
import {AccountBalanceIcon} from "./AccountBalanceIcon";
import {AccountBalance} from "../../screens/accountBalance/AccountBalance";
import {SettingsRowNavigator} from "../settings/SettingsRowNavigator";

export interface AppState{
    afterPress: () => any
}
export const SettingsProfileAccountBalanceComponent: FunctionComponent<AppState> = (props) => {

    const accountBalanceVisiblity = getAccountBalanceVisiblity();
    const [accountBalance, setAccountBalance] = useAccountBalance();
    const translationAccountBalance = useAppTranslation("accountBalance");
    const formatedBalance = useFormatedPrice(accountBalance);

    if(!accountBalanceVisiblity){
        return null;
    }

    return <SettingsRowNavigator accessibilityLabel={translationAccountBalance} destinationComponent={AccountBalance} leftContent={translationAccountBalance+": "+formatedBalance} leftIcon={<AccountBalanceIcon />} />;
}
