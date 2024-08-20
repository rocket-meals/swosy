import {ItemsServiceCreator} from "../helpers/ItemsServiceCreator";
import {CollectionNames} from "../helpers/CollectionNames";
import {NewsParserInterface, NewsTypeForParser} from "./NewsParserInterface";
import {ApiContext} from "../helpers/ApiContext";
import {TranslationHelper} from "../helpers/TranslationHelper";
import {MyDatabaseHelper} from "../helpers/MyDatabaseHelper";
import {FlowStatus} from "../helpers/AppSettingsHelper";
import {News} from "../databaseTypes/types";

const TABLENAME_NEWS = CollectionNames.NEWS;

const SCHEDULE_NAME = "NewsParseSchedule";

export class NewsParseSchedule {

    //TODO stringfiy and cache results to reduce dublicate removing from foodOffers and Meals ...
    private parser: NewsParserInterface;
    private myDatabaseHelper: MyDatabaseHelper;
    private apiContext: ApiContext;

    constructor(apiContext: ApiContext, parser: NewsParserInterface) {
        this.apiContext = apiContext;
        this.myDatabaseHelper = new MyDatabaseHelper(apiContext);
        this.parser = parser;
    }

    async setStatus(status: FlowStatus) {
        await this.myDatabaseHelper.getAppSettingsHelper().setNewsParsingStatus(status);
    }

    async isEnabled() {
        return await this.myDatabaseHelper.getAppSettingsHelper().isNewsParsingEnabled();
    }

    async getStatus() {
        return await this.myDatabaseHelper.getAppSettingsHelper().getNewsParsingStatus();
    }

    async getNewsService() {
        let itemsServiceCreator = new ItemsServiceCreator(this.apiContext);
        return await itemsServiceCreator.getItemsService<News>(TABLENAME_NEWS);
    }

    async parse() {
        let enabled = await this.isEnabled();
        let status = await this.getStatus()

        if (enabled && status === FlowStatus.START) {
            console.log("[Start] "+SCHEDULE_NAME+" Parse Schedule");
            await this.setStatus(FlowStatus.RUNNING);

            try {
                let newsJSONList = await this.parser.getNewsItems();
                await this.updateNews(newsJSONList);

                console.log("Finished");
                await this.setStatus(FlowStatus.FINISHED);
            } catch (err) {
                console.log(SCHEDULE_NAME+" Failed");
                console.log(err);
                await this.setStatus(FlowStatus.FAILED);
            }
        }
    }

    async findOrCreateSingleNews(newsJSON: NewsTypeForParser) {
        let itemService = await this.getNewsService();

        let items = await itemService.readByQuery({
            filter: {external_identifier: {
                    _eq: newsJSON?.basicNews.external_identifier
            }}
        });
        let item = items[0];
        if (!item) {
            let itemId = await itemService.createOne({
                external_identifier: newsJSON?.basicNews.external_identifier,
            });
            item = await itemService.readOne(itemId);
        }
        return item;
    }

    async updateNewsTranslations(item: News, newsJSON: NewsTypeForParser) {
        await TranslationHelper.updateItemTranslations(item, newsJSON.translations, "news_id", CollectionNames.NEWS, this.apiContext);
    }

    async updateOtherFields(item: News, newsJSON: NewsTypeForParser) {
        let itemService = await this.getNewsService();
        await itemService.updateOne(item?.id, newsJSON.basicNews);
    }

    async updateNews(newsJSONList: NewsTypeForParser[]) {
        for (let newsJSON of newsJSONList) {
            let news = await this.findOrCreateSingleNews(newsJSON);
            if (!!news && news?.id) {
                await this.updateOtherFields(news, newsJSON);
                await this.updateNewsTranslations(news, newsJSON);
            }
        }
    }

}
