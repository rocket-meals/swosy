import {MyCardReaderInterface} from "@/app/(app)/accountbalance/MyCardReader";
import {BalanceStateLowerBound} from "@/app/(app)/accountbalance/BalanceStateBounds";
import CardResponse from "@/helper/nfcCardReaderHelper/CardResponse";

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
	private currentDemoBalance: number | null | undefined = 0;

	async isNfcEnabled(): Promise<boolean> {
		return true;
	}

	async isNfcSupported(): Promise<boolean> {
		return true
	}

	async readCard(callBack: (answer: CardResponse | undefined) => Promise<void>, showInstruction: () => void, hideInstruction: () => void, nfcInstruction: string): Promise<void> {
		showInstruction();
		let nextBalance = getNextDemoBalance(this.currentDemoBalance);
		this.currentDemoBalance = nextBalance;
		await new Promise((resolve) => {
			setTimeout(() => {
				resolve(true);
			}, 2000);
		});
		hideInstruction();
		callBack({
			currentBalance: nextBalance.toString(),
			lastTransaction: 0.5.toString(),
			currentBalanceRaw: nextBalance,
			lastTransactionRaw: 0.5,
			chooseAppRaw: "demo",
			tag: "demo",
			readTime: new Date()
		});
	}

}