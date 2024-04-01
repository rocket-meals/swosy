import {MyCardReaderInterface} from "@/app/(app)/accountbalance/MyCardReader";
import {BalanceStateLowerBound} from "@/app/(app)/accountbalance/BalanceStateBounds";

function getNextDemoBalance(displayBalance: number | null | undefined){
	//console.log("demo mode");
	//console.log(BalanceStateLowerBound);
	// get number keys of BalanceStateLowerBound
	let keys = Object.keys(BalanceStateLowerBound);
	// filter keys to only get the numbers
	let numbers = keys.filter((key) => {
			return !isNaN(parseFloat(key));
		}
	);
	//console.log(numbers);
	// get the current index by displayBalance
	let currentDisplayBalance = displayBalance || 0;
	let currentIndex = numbers.indexOf(currentDisplayBalance.toString());
	//console.log("currentIndex: " + currentIndex);
	if(currentIndex === -1){
		currentIndex = 0;
	}
	// get the next index
	let nextIndex = currentIndex + 1;
	if(nextIndex >= numbers.length){
		nextIndex = 0;
	}
	//console.log("nextIndex: " + nextIndex);
	// get the next balance
	return parseFloat(numbers[nextIndex])
}

export default class MyDemoCardReader implements MyCardReaderInterface {
	async isNfcEnabled(): Promise<boolean> {
		return true;
	}

	async isNfcSuppported(): Promise<boolean> {
		return true
	}

	async readCard(callBack: (balance: (number | undefined | null)) => Promise<void>, accountBalance: (number | undefined | null), showInstruction: () => void, hideInstruction: () => void, nfcInstruction: string): Promise<void> {
		showInstruction();
		let nextBalance = getNextDemoBalance(accountBalance);
		await new Promise((resolve) => {
			setTimeout(() => {
				resolve(true);
			}, 3000);
		});
		hideInstruction();
		callBack(nextBalance);
	}

}