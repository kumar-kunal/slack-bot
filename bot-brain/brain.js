require('dotenv').config();
let { Pinecone } = require('@pinecone-database/pinecone');
let { OpenAIEmbeddings } = require("@langchain/openai");
let { loadQAStuffChain } = require("langchain/chains");
let { Document } = require("langchain/document");
const LangchainOpenAI = require("@langchain/openai").OpenAI;
const { v4: uuidv4 } = require('uuid');


const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    batchSize: 100,
    model: 'text-embedding-3-large',
});

const vectorDb = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});

const llm = new LangchainOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
});

async function getEmbeddedData( data ){
    const rawEmbeddedData = await embeddings.embedDocuments(data);

    return rawEmbeddedData;

}

async function storeEmbeddedData( rawEmbeddedData, data ){

    const formattedEmbeddedData = rawEmbeddedData.map((embedding, i) => ({
        id: uuidv4(),
        values: embedding,
        metadata: {
            text: data[i],
        }
    }));

    const indexName = process.env.PINECONE_INDEX_NAME;

    const index = vectorDb.index(indexName);

    const updatedValue = await index.upsert(formattedEmbeddedData);
    return updatedValue;

}

async function enrichKnowledgeBase( data ){
    try {
        const rawEmbeddedData = await getEmbeddedData( data );
        console.log('embeddind done');
        await storeEmbeddedData( rawEmbeddedData, data );
        console.log('data stored')
    }
    catch( error ){
        console.error('Error enriching knowledge base:', error);
    }
}

async function queryKnowledgeBase( query ){
    if(!query){
        return 'NOT_FOUND';
    }
    const queryEmbedding = await embeddings.embedQuery(query);
    
    const indexName = process.env.PINECONE_INDEX_NAME;
    const index = vectorDb.index(indexName);
    let queryResponse = await index.query({
        vector: queryEmbedding,
        topK: 5,
        includeMetadata: true,
    });

    const concatenatedText = queryResponse.matches
        .map((match) => match.metadata.text)
        .join(" ");

    const stuffDocumentChain = loadQAStuffChain(llm);

    const formattedQuery = query +  '\n \n' + 'IMPORTANT NOTE: Give answer as `NOT_FOUND`  if you do not get answer in the above context. \n\n';

    console.log(`Asked Query: ${formattedQuery}`);
    console.log(`Concatenated Text: ${concatenatedText}`);

    const result = await stuffDocumentChain.invoke({
        input_documents: [new Document({ pageContent: concatenatedText })],
        question: formattedQuery,
    });

    console.log(`Answer: ${result.text}`);
    return result.text;
}

async function formatQuery( rawQuery ) {
    let formattedQuery = rawQuery?.toLowerCase()?.replace(/[^\w\s]/gi, '');
    return formattedQuery;

}

async function askLLM( rawQuery ) {
    const formattedQuery = await formatQuery( rawQuery );
    return await queryKnowledgeBase( formattedQuery );
}

async function tellLLM( data ) {
    return await enrichKnowledgeBase( data );
}

module.exports = { askLLM, tellLLM };