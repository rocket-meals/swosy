// @ts-nocheck
import React, {FunctionComponent} from "react";
import {MoneyConfused} from "../animations/accountBalance/MoneyConfused";
import {MoneyConfident} from "../animations/accountBalance/MoneyConfident";
import {MoneyFitness} from "../animations/accountBalance/MoneyFitness";
import {MoneySad} from "../animations/accountBalance/MoneySad";

export interface AppState{
    balance: number | null | undefined
}

export enum BalanceStateLowerBound{
    CONFIDENT = 10,
    FITNESS = 3,
    SAD = 0,
    CONFUSED = -0.01
}

export const AccountBalanceAnimation: FunctionComponent<AppState> = (props) => {
    const balance = props?.balance;

    if(balance===undefined || balance < 0){
        return <MoneyConfused />
    }

    if(balance >= BalanceStateLowerBound.CONFIDENT){
        return <MoneyConfident />
    } else if(balance >= BalanceStateLowerBound.FITNESS){
        return <MoneyFitness />
    } else if(balance >= BalanceStateLowerBound.SAD){
        return <MoneySad />
    }

    return <MoneyConfused />
}
