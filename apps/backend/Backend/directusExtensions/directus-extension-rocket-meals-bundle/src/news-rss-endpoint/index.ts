import { defineEndpoint } from '@directus/extensions-sdk';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { ApiContext } from '../helpers/ApiContext';
import { RssBuilder } from './RssBuilder';
import { NewsDisplayLocations } from 'repo-depkit-common';

const EndpointTopName = 'rss-news.xml';

export default defineEndpoint({
  id: EndpointTopName,
  handler: (router, apiContext: ApiContext) => {
    router.get('/', async (_req, res) => {
      const myDatabaseHelper = new MyDatabaseHelper(apiContext);
      const newsHelper = myDatabaseHelper.getNewsHelper();
      // Only news of the news list: news shown only as popup or in the food offers stay in the app.
      const news = await newsHelper.readByQueryWithTranslations({
        limit: 100,
        sort: ['-date'],
        filter: {
          _or: [{ display_locations: { _null: true } }, { display_locations: { _contains: NewsDisplayLocations.news_list } }],
        },
      });

      const rss = RssBuilder.buildRss(news, myDatabaseHelper.getServerUrl());
      res.set('Content-Type', 'application/rss+xml; charset=UTF-8');
      res.send(rss);
    });
  },
});
