export class NewsHelper{

	public static getDemoNewsDict(){
		let amount = 20;
		let output = {};
		// a list of string names as titles containing headlines news
		let titles = [
			"New Noodles",
			"Price Reduction",
			"New Staff",
			"Changed Opening Hours",
			"New Menu",
			"Location change",
			"New Restaurant",
			"New Food",
			"New Drinks",
			"New Dishes",
			"New Ingredients",
		]
		for(let index = 0; index<amount; index++){
			let id = index+1;
			let title = titles[index%titles.length];
			let newsItem = NewsHelper.getDemoNewsByIndex(title, id)
			output[newsItem.id] = newsItem;
		}
		return output;
	}

	private static getDemoNewsByIndex(custonName?, index?){
		let demoName = custonName || "Food Name";

		return {
			"id": index,
			"translations": [
				{
					"id": 7469,
					"languages_code": "de-DE",
					"news_id": "1216-1884",
					"title": "DEMO "+demoName+" DE",
					"content": "DEMO Content "+demoName+" DE",
				},
				{
					"id": 7470,
					"languages_code": "en-US",
					"news_id": "1216-1884",
					"name": "DEMO "+demoName+" EN",
					"content": "DEMO Content "+demoName+" EN",
				}
			]
		}
	}

}
