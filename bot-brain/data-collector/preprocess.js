const natural = require('natural');
const stopword = require('stopword');
const fs = require("fs")
const lodash = require('lodash');

const rawArticleData = require('../public/articles.json');

function preprocessForEmbedding(){

    const preprocessArticles = (articles) => {
    const tokenizer = new natural.WordTokenizer();
    const stemmer = natural.PorterStemmer;

    return articles.map(article => {
        const preprocessedTextContents = article.textContents.map(text => {
        // Convert to lowercase
        let cleanedText = text.toLowerCase();

        // Tokenize the text
        let tokens = tokenizer.tokenize(cleanedText);

        // Remove stop words
        //   tokens = stopword.removeStopwords(tokens);

        // Stem the words
        //   tokens = tokens.map(token => stemmer.stem(token));

        // Rejoin tokens into a cleaned string
        cleanedText = tokens.join(' ');

        const chunks = lodash.chunks(tokens, 1000).map(chunk => chunk.join(' '));
        return chunks;
        });

        return {
        title: article.title,
        textContents: preprocessedTextContents[0],
        contentSize: preprocessedTextContents[0][0]?.length
        };
    });
    };


    const preprocessedArticles = preprocessArticles(rawArticleData.articles);

    fs.writeFileSync('./public/cleaned-articles.json', JSON.stringify({ articles: preprocessedArticles, count: preprocessedArticles.length }, null, 2));

    console.log('Data is cleaned')
}

module.exports = {preprocessForEmbedding}
