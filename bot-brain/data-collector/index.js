const runDataCollector = require('./data-collector');
const cron = require('node-cron');
const dataToFeed = require('../public/cleaned-articles.json');
const { tellLLM } = require('../brain');
const { text } = require('express');
const { preprocessForEmbedding } = require('./preprocess');

async function feedDataToLLM() {
    (dataToFeed?.articles || []).forEach( async (article) => {
        const { textContents } = article;
        if(textContents?.length){
            await tellLLM(textContents);
        }
    });
}

console.log('Setting up Data Collector Cron for every day at midnight...✅');
cron.schedule('0 0 * * *', async () => {
    console.log('Data Collector Cron Started...👷🏻');
    await runDataCollector();
    console.log('Data Collector Cron Ended...✅');
    preprocessForEmbedding()
    console.log('Data Feeder Cron Started...👷🏻');
    await feedDataToLLM();
    console.log('Data Feeder Cron Ended...✅');
});