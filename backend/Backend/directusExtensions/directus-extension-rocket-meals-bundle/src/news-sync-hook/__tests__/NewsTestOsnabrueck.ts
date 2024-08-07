// small jest test
import {describe, expect, it} from '@jest/globals';
import {StudentenwerkOsnabrueckNews_Parser} from "../StudentenwerkOsnabrueckNews_Parser";

describe("NewsTestOsnabrueck", () => {
    let newsParser = new StudentenwerkOsnabrueckNews_Parser();

    it("should find news with fields", async () => {
        let news = await newsParser.getRealNewsItems();
        console.log("Found news: " + news.length);
        expect(news.length).toBeGreaterThan(0);
    });
});