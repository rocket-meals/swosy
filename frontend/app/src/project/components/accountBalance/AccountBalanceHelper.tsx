// @ts-nocheck
import React from "react";
import {useSynchedProfile} from "../../components/profile/ProfileAPI";
import {useSynchedSettingsAccountBalance} from "../../helper/synchedJSONState";

export function getAccountBalanceVisiblity(): boolean{
    const [accountBalanceSettings, setAccountBalanceSettings] = useSynchedSettingsAccountBalance()
    return accountBalanceSettings?.["enabled"];
}

export function useAccountBalance(): [number, (newBalance: number) => void]{
    const [profile, setProfile] = useSynchedProfile();
    const FIELD_CREDIT_BALANCE = "credit_balance";
    let balance = profile?.[FIELD_CREDIT_BALANCE];
    const setNewBalance = (accountBalance: number) => {
        profile[FIELD_CREDIT_BALANCE] = accountBalance;
        setProfile(profile);
    }
    return [balance, setNewBalance];
}
