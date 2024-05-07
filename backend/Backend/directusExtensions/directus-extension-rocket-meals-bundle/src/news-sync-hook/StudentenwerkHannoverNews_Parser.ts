import axios from "axios";
import cheerio from 'cheerio';

const baseUrl = 'https://www.studentenwerk-hannover.de';
const newsUrl = `${baseUrl}/unternehmen/news`;

export class StudentenwerkHannoverNews_Parser {

    constructor() {

    }

    async getJSONList() {
        let realNewsItems = await this.getRealNewsItems();
        return [...realNewsItems];
    }

    async getRealNewsItems() {
        try {
            console.log("getRealNewsItems");
            let response = await axios.get(newsUrl);
            console.log("Fetched url");
            const $ = cheerio.load(response.data);

            let data = [];
            $('div.article').each((index, element) => {
                // Extract image URL from the inline style
                let imageStyle = $(element).find('div.news-slider-image').attr('style');
                let imageUrlMatch = imageStyle ? imageStyle.match(/url\(['"]?(.*?)['"]?\)/) : null;
                let imageUrl = imageUrlMatch ? baseUrl + imageUrlMatch[1] : '';

                // Extract link URL
                let articleUrl = baseUrl + $(element).find('a.articleLink').attr('href');

                // Extract article title
                let header = $(element).find('h3').text().trim();

                // Extract article content
                let content = $(element).find('div.news_slider-content_teaser').text();

                // Extract categories
                let categories = {};
                $(element).find('div.news_slider-content_categorie').each((index, el) => {
                    let categoryName = $(el).text().trim();
                    categories[categoryName] = categoryName;
                });

                data.push({
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
                    categories: categories
                });
            });

            data.reverse(); // latest news are on top

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
                "de-DE": {
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
