// small jest test
import {describe, expect, it, jest} from '@jest/globals';
import {StudentenwerkHannoverNews_Parser} from "../StudentenwerkHannoverNews_Parser";
import axios from "axios";
import path from "path";
import fs from "fs";

// load preloaded html file content from "./HannoverNews.html"
const htmlNews = fs.readFileSync(path.resolve(__dirname, './hannover/News.html'), 'utf8');
const htmlNewsUnterstuetzungBeimStart = fs.readFileSync(path.resolve(__dirname, './hannover/NewsUnterstuetzungBeimStart.html'), 'utf8');
const htmlNewsBafoegAntragLeichterGemacht = fs.readFileSync(path.resolve(__dirname, './hannover/NewsBafoegAntragLeichterGemacht.html'), 'utf8');

describe("NewsTestHannover", () => {
    let newsParser = new StudentenwerkHannoverNews_Parser();

    it("should find news with fields", async () => {
        let limitAmountNews = 2;
        jest.mock('axios');
        // mock for StudentenwerkHannoverNews_Parser.baseUrl repsone only
        // check if url is StudentenwerkHannoverNews_Parser.baseUrl
        // Mock axios.get only for specific URLs

        jest.spyOn(axios, 'get').mockImplementation((url) => {
            if (url === StudentenwerkHannoverNews_Parser.newsUrl) {
                return Promise.resolve({ data: htmlNews });
            } else if (url === StudentenwerkHannoverNews_Parser.newsUrl+"/detail/unterstuetzung-beim-start") {
                // Mock response for a specific article detail page
                return Promise.resolve({ data: htmlNewsUnterstuetzungBeimStart});
            } else if(url === StudentenwerkHannoverNews_Parser.newsUrl+"/detail/bafoeg-antrag-leichter-gemacht") {
                // Mock response for a specific article detail page
                return Promise.resolve({ data: htmlNewsBafoegAntragLeichterGemacht});
            }
            return Promise.reject(new Error('Unknown URL'));
        });


        let news = await newsParser.getRealNewsItems(limitAmountNews);
        expect(news.length).toBeGreaterThan(0);
    });
});