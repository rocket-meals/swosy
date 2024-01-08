import axios from "axios";
import JSSoup from 'jssoup';


const baseUrl = 'https://www.studentenwerk-hannover.de';
const newsUrl = `${baseUrl}/unternehmen/news`;

export class StudentenwerkHannoverNews_Parser {

    constructor() {

    }

    async getJSONList(){
        //let demoNewsItem = await this.getDemoNewsItem();
        let realNewsItems = await this.getRealNewsItems();
        return [...realNewsItems];
    }

    async getRealNewsItems(){
        try{
            console.log("getRealNewsItems")
            let response = await axios.get(newsUrl);
            console.log("Fetched url")
            let soup = new JSSoup(response.data);
            let articles = soup.findAll('div', 'article');

            let data = articles.map((article, index) => {
                let imageElement = article.find('div', 'news-slider-image');
                let imageStyle = imageElement.attrs.style;
                let imageUrlMatch = imageStyle.match(/url\('(.*?)'\)/);
                let imageUrl = imageUrlMatch ? baseUrl + imageUrlMatch[1] : '';

                let linkElement = article.find('a', 'articleLink');
                let articleUrl = linkElement ? baseUrl + linkElement.attrs.href : '';

                let headerElement = article.find('h3');
                let header = headerElement ? headerElement.text.trim() : '';

                let contentElement = article.find('div', 'news_slider-content_teaser');
                let content = contentElement ? contentElement.text : '';

                let categoryElements = article.findAll('div', 'news_slider-content_categorie');
                let categories = {};
                if(categoryElements) {
                    categoryElements.forEach(categoryElement => {
                        let categoryName = categoryElement.getText().trim();
                        categories[categoryName] = categoryName;
                    });
                }

                return {
                    external_identifier: "news_" + header.replace(/\W+/g, '_'),
                    image_remote_url: imageUrl,
                    url: articleUrl,
                    translations: {
                        "de-DE": {
                            title: header,
                            content: content,
                            be_source_for_translations: true,
                            let_be_translated: false,
                            create_translations_for_all_languages: true,
                        },
                    },
                    categories: categories
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
