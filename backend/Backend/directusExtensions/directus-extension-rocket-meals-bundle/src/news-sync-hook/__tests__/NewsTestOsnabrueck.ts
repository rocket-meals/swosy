// small jest test
import {describe, expect, it, jest} from '@jest/globals';
import {StudentenwerkOsnabrueckNews_Parser} from "../StudentenwerkOsnabrueckNews_Parser";
import axios from "axios";
import path from "path";
import fs from "fs";

const html = fs.readFileSync(path.resolve(__dirname, './osnabrueck/News.html'), 'utf8');

describe("NewsTestOsnabrueck", () => {
    let newsParser = new StudentenwerkOsnabrueckNews_Parser();

    it("should find news with fields", async () => {
        jest.spyOn(axios, 'get').mockImplementation((url) => {
            if (url === StudentenwerkOsnabrueckNews_Parser.newsUrl) {
                return Promise.resolve({ data: html });
            }
            return Promise.reject(new Error('Unknown URL'));
        });

        let news = await newsParser.getRealNewsItems();
        //console.log("Found news: " + news.length);
        expect(news.length).toBeGreaterThan(0);
    });
});