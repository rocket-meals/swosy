import axios from "axios";
import JSSoup from 'jssoup';


const baseUrl = 'https://www.studentenwerk-osnabrueck.de/';
const newsUrl = `https://www.studentenwerk-osnabrueck.de/de/nachrichten.html`;

export class StudentenwerkOsnabrueckNews_Parser {

    constructor() {

    }

    async getJSONList(){
        //let demoNewsItem = await this.getDemoNewsItem();
        let realNewsItems = await this.getRealNewsItems();
        return [...realNewsItems];
    }

    async getRealNewsItems(){
        try {
            console.log("getRealNewsItems");
            let response = await axios.get(newsUrl);
            console.log("Fetched url");
            let soup = new JSSoup.default(response.data);
            let articles = soup.findAll('div', 'article');

            let data = articles.map((article, index) => {
                let imageElement = article.find('img'); // Changed this line
                let imageUrl = imageElement ? baseUrl + imageElement.attrs.src : ''; // Changed this line

                let linkElement = article.find('a');
                let articleUrl = linkElement ? baseUrl + linkElement.attrs.href : '';

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

                return {
                    external_identifier: "news_" + header.replace(/\W+/g, '_'),
                    image_remote_url: imageUrl,
                    alias: header,
                    date: new Date(),
                    url: articleUrl,
                    translations: {
                        "de-DE": {
                            title: header,
                            content: content,
                            be_source_for_translations: true,
                            let_be_translated: false,
                        },
                    },
                    categories: {} // Assuming no category data; fill in as needed
                };
            });

            data.reverse(); // latest news are on top

            return data;
        } catch(error) {
            console.log(error);
        };
    }


    async getDemoNewsItem(){
        return {
            external_identifier: "demo",
            image_remote_url: "https://www.studentenwerk-hannover.de/fileadmin/user_upload/Bilder/4_Beratung/JEE_151007_DSW-Berlin_0709.jpg",
            url: "https://www.studentenwerk-hannover.de/unternehmen/news/detail/semesterbeitragsstipendium",
            translations: {
                "de-DE": {
                    title: "Semesterbeitragsstipendium",
                    content: "Bewerbung jetzt auch digital möglich",
                    be_source_for_translations: true,
                    let_be_translated: false,
                    create_translations_for_all_languages: true,
                },
//                "en-US": {"name": food?.nameEng}
            }
        }
    }

}
