const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const { SELECTOR_TAGS } = require('./data-collector.constants');

const baseUrl = process.env.SOURCE_WEBSITE_BASE_URL;
const visitedUrls = new Set();
const articles = [];

async function fetchPage(url) {
    if (visitedUrls.has(url)) return null;
    visitedUrls.add(url);

    try {
        const { data } = await axios.get(url);
        return cheerio.load(data);
    } catch (error) {
        console.error(`Error fetching ${url}:`, error.message);
        return null;
    }
}

async function scrapeArticlePage(url) {
    try {
        const $ = await fetchPage(url);
        if (!$) return;

        $(SELECTOR_TAGS.ARTICLE_CONTENT).each(async (index, element) => {
            const title = $(element).find(SELECTOR_TAGS.HEADLINE).text().trim();
            let textContent = '';
            let videoLinks = [];

            $(element).find(SELECTOR_TAGS.CONTENT_BLOCK).each((i, el) => {
                textContent += $(el).text().trim() + ' ';
            });

            $(element).find(SELECTOR_TAGS.IFRAME).each((i, el) => {
                const src = $(el).attr(SELECTOR_TAGS.SOURCE);
                if (src) {
                    videoLinks.push(src);
                }
            });
            // text contents should be array of strings having 0 to 800 characters and ending with a full stop.
            const textContents = [textContent];

            articles.push({ title, textContents });
            fs.writeFileSync('./public/articles.json', JSON.stringify({ articles: articles, count: articles.length }, null, 2));
        });
    } catch (error) {
        console.error(`Error fetching ${url}:`, error.message);
        return null;
    }
}

async function scrapeCategoryPage(url) {
    const $ = await fetchPage(url);
    if (!$) return;

    $(SELECTOR_TAGS.CONTENT).each(async (index, element) => {
        const href = $(element).attr(SELECTOR_TAGS.LINK);
        if (href) {
            const newUrl = new URL(href, baseUrl).toString();
            await scrapeArticlePage(newUrl);
        }
    });
}

async function scrapeMainPage(url) {
    const $ = await fetchPage(url);
    if (!$) return;
    $(SELECTOR_TAGS.CATEGORY_BLOCK).each(async (index, element) => {
        const href = $(element).attr(SELECTOR_TAGS.LINK);
        if (href) {
            const newUrl = new URL(href, baseUrl).toString();
            await scrapeCategoryPage(newUrl);
        }
    });
}

async function runDataCollector() {
    await scrapeMainPage(baseUrl);
}

module.exports = runDataCollector;
