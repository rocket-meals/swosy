import axios from "axios";
import JSSoup from 'jssoup';
import {TranslationHelper} from "../helpers/TranslationHelper";
import {NewsParserInterface, NewsTypeForParser} from "./NewsParserInterface";


export class StudentenwerkOsnabrueckNews_Parser implements NewsParserInterface{

    static baseUrl = 'https://www.studentenwerk-osnabrueck.de/';
    static newsUrl = `https://www.studentenwerk-osnabrueck.de/de/nachrichten.html`;

    constructor() {

    }

    async getNewsItems(): Promise<NewsTypeForParser[]> {
        //let demoNewsItem = await this.getDemoNewsItem();
        let realNewsItems = await this.getRealNewsItems();
        return [...realNewsItems];
    }

    async getRealNewsItems(): Promise<NewsTypeForParser[]> {
        try {
            //console.log("getRealNewsItems");
            let response = await axios.get(StudentenwerkOsnabrueckNews_Parser.newsUrl);
            //console.log("Fetched url");
            let soup = new JSSoup(response.data);
            let articles = soup.findAll('div', 'article');

            let news: NewsTypeForParser[] = [];

            articles.map((article: any, index: any) => {
                let imageElement = article.find('img'); // Changed this line
                let imageUrl = imageElement ? StudentenwerkOsnabrueckNews_Parser.baseUrl + imageElement.attrs.src : ''; // Changed this line

                let linkElement = article.find('a');
                let articleUrl = linkElement ? StudentenwerkOsnabrueckNews_Parser.baseUrl + linkElement.attrs.href : '';

                let headerElement = article.find('span');
                let header = headerElement ? headerElement.text.trim() : '';

                let contentElement = article.find('div', 'teaser-text').find('div'); // Changed this line
                let content = contentElement ? contentElement.text.trim() : ''; // Changed this line to remove redundant spaces
                // replace in the content at the end : Weiterlesen
                content = content.replace(/Weiterlesen$/, '').trim();
                // replace at the end every \n and \t
                content = content.replace(/\n$/, '').trim();
                content = content.replace(/\t$/, '').trim();
                // replace every &nbsp;
                content = content.replace(/&nbsp;/g, ' ').trim();

                // Categories processing can be added here if available

                news.push({
                    external_identifier: "news_" + header.replace(/\W+/g, '_'),
                    image_remote_url: imageUrl,
                    alias: header,
                    date: new Date().toISOString(),
                    url: articleUrl,
                    translations: {
                        [TranslationHelper.LANGUAGE_CODE_DE]: {
                            title: header,
                            content: content,
                            be_source_for_translations: true,
                            let_be_translated: false,
                        },
                    },
                    categories: {} // Assuming no category data; fill in as needed
                });
            });

            news.reverse(); // latest news are on top

            return news;
        } catch(error) {
            console.log(error);
        };
        return [];
    }

}
