import axios from "axios";
import cheerio from 'cheerio';
import {TranslationHelper} from "../helpers/TranslationHelper";

const baseUrl = 'https://www.studentenwerk-hannover.de';
const newsUrl = `${baseUrl}/unternehmen/news`;
const newsDetailArticleUrlStart = "/unternehmen/news";

export class StudentenwerkHannoverNews_Parser {

    constructor() {

    }

    async getJSONList(){
        //let demoNewsItem = await this.getDemoNewsItem();
        let realNewsItems = await this.getRealNewsItems();
        return [...realNewsItems];
    }

    async getRealNewsItems(limitAmountNews?: number | undefined) {
        try {
            console.log("getRealNewsItems from: " + newsUrl);
            let response = await axios.get(newsUrl);
            console.log("Fetched url");
            const $newsIndexArticle = cheerio.load(response.data);

            let data = [];
            let articleItems = $newsIndexArticle('div.article');
            console.log("Found news items: " + articleItems.length);
            let limit = limitAmountNews ? Math.min(limitAmountNews, articleItems.length) : articleItems.length;
            for(let index = 0; index < articleItems.length && index < limit; index++) {
                let element = articleItems[index];
                console.log("Parsing news item index: " + index);
                // Extract image URL from the inline style
                let imageStyle = $newsIndexArticle(element).find('div.news-slider-image').attr('style');
                let imageUrlMatch = imageStyle ? imageStyle.match(/url\(['"]?(.*?)['"]?\)/) : null;
                let imageUrl = imageUrlMatch ? baseUrl + imageUrlMatch[1] : '';

                // Extract article title
                let header = $newsIndexArticle(element).find('h3').text().trim();
                //console.log("Header: " + header)

                // Extract article content
                let content = $newsIndexArticle(element).find('div.news_slider-content_teaser').text();
                // trim content and remote tabs at the beginning and end
                if(!!content) {
                    content = content.trim();
                }


                // Extract link URL
                let date = undefined;
                let articleUrl = $newsIndexArticle(element).find('a.articleLink').attr('href');
                if(!!articleUrl){
                    if(articleUrl.startsWith(newsDetailArticleUrlStart)) {
                        articleUrl = baseUrl + articleUrl;
                    }


                    // visit article page to get the date
                    try{
                        let articleResponse = await axios.get(articleUrl);
                        const $articleDetails = cheerio.load(articleResponse.data);
                        // search for itemprop="datePublished"
                        let datePublished = $articleDetails("div.news-list-date")
                        let datePublishedText = datePublished.text().trim();
                        //console.log("Fetching article page: " + articleUrl);
                        //console.log("Date published: " + datePublishedText);
                        // has format: 24.05.2024
                        let dateParts = datePublishedText.split('.');
                        date = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
                        // set date time to 12:00
                        date.setHours(12, 0, 0, 0);
                    } catch (error) {
                        console.log("Error fetching article page: " + articleUrl);
                    }
                }



                // Extract categories
                let categories = {};
                $newsIndexArticle(element).find('div.news_slider-content_categorie').each((index, el) => {
                    let categoryName = $newsIndexArticle(el).text()
                    if(!!categoryName) {
                        categoryName = categoryName.trim();
                        categories[categoryName] = categoryName;
                    }
                });

                data.push({
                    external_identifier: "news_" + header.replace(/\W+/g, '_'),
                    image_remote_url: imageUrl,
                    alias: header,
                    date: date,
                    url: articleUrl,
                    translations: {
                        [TranslationHelper.LANGUAGE_CODE_DE]: {
                            title: header,
                            content: content,
                            be_source_for_translations: true,
                            let_be_translated: false,
                        },
                    },
                    categories: categories
                });
            };

            data.reverse(); // latest news are on top

            console.log("Found news items: " + data.length);
            return data;
        } catch (error) {
            console.log(error);
        }
    }

    async getDemoNewsItem() {
        return {
            external_identifier: "demo",
            image_remote_url: "https://www.studentenwerk-hannover.de/fileadmin/user_upload/Bilder/4_Beratung/JEE_151007_DSW-Berlin_0709.jpg",
            url: "https://www.studentenwerk-hannover.de/unternehmen/news/detail/semesterbeitragsstipendium",
            translations: {
                [TranslationHelper.LANGUAGE_CODE_DE]: {
                    title: "Semesterbeitragsstipendium",
                    content: "Bewerbung jetzt auch digital möglich",
                    be_source_for_translations: true,
                    let_be_translated: false,
                    create_translations_for_all_languages: true,
                }
            }
        }
    }
}
