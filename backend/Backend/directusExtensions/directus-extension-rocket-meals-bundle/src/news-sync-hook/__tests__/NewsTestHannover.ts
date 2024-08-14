// small jest test
import {describe, expect, it} from '@jest/globals';
import {StudentenwerkHannoverNews_Parser} from "../StudentenwerkHannoverNews_Parser";

describe("NewsTestHannover", () => {
    let newsParser = new StudentenwerkHannoverNews_Parser();

    it("should find news with fields", async () => {
        let limitAmountNews = 2;
        let news = await newsParser.getRealNewsItems(limitAmountNews);
        expect(news.length).toBeGreaterThan(0);
    });
});