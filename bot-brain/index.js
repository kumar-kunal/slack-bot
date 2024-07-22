const express = require('express');
const { askLLM } = require('./brain');
require('dotenv').config();
const app = express();
const bodyParser = require('body-parser')

app.use(bodyParser.json());

require('./data-collector/index');

app.get('/', (req, res) => {
    res.send('Welcome to the LLM APIs!');
});

app.post('/api/llm/ask', async (req, res) => {
    try {
        console.log('Question:', req.body);
        const question = req.body.question;
        const answer = await askLLM(question);
        res.status(200).send(answer);
    } catch (error) {
        console.error('Error asking LLM:', error);
        res.status(500).send('Error asking LLM');
    }
});

app.listen(process.env.LLM_PORT, () => {
    console.log('Server is running on port ' + process.env.LLM_PORT + '...🚀');
});