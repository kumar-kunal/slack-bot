const { default: axios } = require('axios');
const { llmService } = require('../config.json');
const { createBugTicket } = require('../handlers/jira-handler');



async function askLLM(question) {
    const response = await axios.post(`${llmService.host}${llmService.path.ask}`, {
        question
    });
    return response.data;
}

async function generateJiraTicket(message, channelName) {
    const summary = `Issue ticket from channel-${channelName}`;
    const description = message;
    const module = "";
    const ticketLink = await createBugTicket(summary, description, module);
    const response = `Bug ticket created: ${ticketLink}`;
    return response;
}

async function replyToMessage( message, channelName ){
    const llmRespnse  = await askLLM(message);
    if(llmRespnse.includes("NOT_FOUND")){
        const jiraResponse = await generateJiraTicket(message, channelName);
        return jiraResponse;
    }
    return llmRespnse;
}

module.exports = {replyToMessage}