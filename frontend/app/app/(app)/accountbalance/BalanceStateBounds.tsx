import React from 'react';
import {MoneyConfused} from "@/compositions/animations/accountBalance/MoneyConfused";
import {MoneyConfident} from "@/compositions/animations/accountBalance/MoneyConfident";
import {MoneyFitness} from "@/compositions/animations/accountBalance/MoneyFitness";
import {MoneySad} from "@/compositions/animations/accountBalance/MoneySad";
import {RectangleWithLayoutCharactersWide} from "@/components/shapes/Rectangle";

export enum BalanceStateLowerBound{
	CONFIDENT = 10,
	FITNESS = 3,
	SAD = 0,
	CONFUSED = -0.01
}

type AccountBalanceAnimationProps = {
	balance: number | undefined | null
}
export const AccountBalanceAnimation = (props: AccountBalanceAnimationProps) => {
	const balance = props.balance;

	let animation = <MoneyConfused />

	switch (balance) {
		case undefined:
		case null:
			animation = <MoneyConfused />
			break;
		default:
			if(balance >= BalanceStateLowerBound.CONFIDENT){
				animation = <MoneyConfident />
			} else if(balance >= BalanceStateLowerBound.FITNESS){
				animation = <MoneyFitness />
			} else if(balance >= BalanceStateLowerBound.SAD){
				animation = <MoneySad />
			}
			break;
	}

	return (
		<RectangleWithLayoutCharactersWide amountOfCharactersWide={20}>
			{animation}
		</RectangleWithLayoutCharactersWide>
	)
}
