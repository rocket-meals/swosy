// small jest test
import { beforeAll, describe, expect, it } from '@jest/globals';
import { StudentenwerkHannoverNewsParser } from '../StudentenwerkHannoverNewsParser';
import path from 'path';
import fs from 'fs';
import { FetchHelper } from '../../../helpers/FetchHelper';

// load preloaded html file content from "./HannoverNews.html"
const htmlNews = fs.readFileSync(path.resolve(__dirname, './News.html'), 'utf8');
const htmlNewsUnterstuetzungBeimStart = fs.readFileSync(path.resolve(__dirname, './NewsUnterstuetzungBeimStart.html'), 'utf8');
const htmlNewsBafoegAntragLeichterGemacht = fs.readFileSync(path.resolve(__dirname, './NewsBafoegAntragLeichterGemacht.html'), 'utf8');

/**
 * During a maintenance studentenwerk-hannover.de answers every page with a maintenance page
 * ("Wartungsarbeiten", the news page with 404). The tests below read the live website, so they
 * then pass without checking anything – the parser is not broken, the website is just away.
 */
async function isWebsiteInMaintenance(): Promise<boolean> {
  try {
    const html = await FetchHelper.fetchPage(StudentenwerkHannoverNewsParser.baseUrl);
    return /<title>[^<]*Wartungsarbeiten/i.test(html);
  } catch {
    return false;
  }
}

describe('NewsTestHannover', () => {
  let newsParser = new StudentenwerkHannoverNewsParser();
  let websiteInMaintenance = false;

  beforeAll(async () => {
    websiteInMaintenance = await isWebsiteInMaintenance();
    if (websiteInMaintenance) {
      console.warn('NewsTestHannover: studentenwerk-hannover.de shows its maintenance page, the live news tests are skipped.');
    }
  });

  it('should find news with fields', async () => {
    if (websiteInMaintenance) return;
    let limitAmountNews = 2;
    let news = await newsParser.getRealNewsItems(undefined, limitAmountNews);
    expect(news.length).toBeGreaterThan(0);
  });

  it('test date from news article', async () => {
    if (websiteInMaintenance) return;
    // Take an article that is currently listed instead of a fixed URL: old articles get removed (404) over time.
    let news = await newsParser.getRealNewsItems(undefined, 5);
    let articleUrl = news.find(newsItem => !!newsItem.basicNews.url)?.basicNews.url ?? undefined;
    expect(articleUrl).toBeDefined();

    let response = await StudentenwerkHannoverNewsParser.fetchArticleDate(articleUrl);
    expect(response).not.toBeNull();

    let dateObj = new Date(response as string);
    expect(Number.isNaN(dateObj.getTime())).toBe(false);
    expect(dateObj.toISOString()).toBe(response);
    // the parser sets every article date to 12:00 local time
    expect(dateObj.getHours()).toBe(12);
    expect(dateObj.getMinutes()).toBe(0);
    expect(dateObj.getTime()).toBeLessThanOrEqual(Date.now() + 24 * 60 * 60 * 1000);
  });

  it('real news', async () => {
    if (websiteInMaintenance) return;
    let news = await newsParser.getRealNewsItems(undefined, 5);
    expect(news.length).toBeGreaterThan(0);
    let sortedNews = news.sort((a, b) => {
      let dateA_raw = a.basicNews.date;
      let dateB_raw = b.basicNews.date;

      // latest articles first

      // if no date, sort to the end
      if (!dateA_raw) return 1; // dateA is undefined, so it goes to the end
      if (!dateB_raw) return -1; // dateB is undefined, so it goes to the end

      let dateA = new Date(dateA_raw);
      let dateB = new Date(dateB_raw);
      return dateB.getTime() - dateA.getTime(); // latest articles first
    });

    for (let newsItem of news) {
      expect(newsItem.basicNews.external_identifier).toBeDefined();
      expect(newsItem.basicNews.image_remote_url).toBeDefined();
      expect(newsItem.basicNews.alias).toBeDefined();
      expect(newsItem.basicNews.date).toBeDefined();
      expect(newsItem.basicNews.url).toBeDefined();
    }
  });
});
