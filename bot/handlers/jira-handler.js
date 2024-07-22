const axios = require('axios');
require('dotenv').config();

const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY;
const JIRA_SPRINT_ID = process.env.JIRA_SPRINT_ID;
const JIRA_ISSUE_TYPE = process.env.JIRA_ISSUE_TYPE;

// Module to person mapping
const moduleAssigneeMapping = {
  'module1': 'assignee1',
  'module2': 'assignee2',
  // Add more modules and assignees as needed
};

// Create a new bug ticket in the current sprint
async function createBugTicket(summary, textContent, module) {
  try {
    const response = await axios.post(`${JIRA_BASE_URL}/rest/api/3/issue`, {
      fields: {
        project: {
          key: JIRA_PROJECT_KEY,
        },
        summary,
        description: {
        content: [
          {
            content: [
              {
                text: textContent,
                type: "text"
              }
            ],
            type: "paragraph"
          }
        ],
        type: "doc",
        version: 1
      },
        issuetype: {
          name: 'Bug',
        },
        // customfield_10020: JIRA_SPRINT_ID, // Sprint custom field (replace with your field ID)
        // assignee: {
        //   name: moduleAssigneeMapping[module] || 'defaultAssignee',
        // },
        labels: [module],
        issuetype: {
          id: JIRA_ISSUE_TYPE
        }
      },
    }, {
      auth: {
        username: JIRA_EMAIL,
        password: JIRA_API_TOKEN,
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
    });
    const ticketLink = `${JIRA_BASE_URL}/browse/${response.data.key}`;
    console.log(`Bug ticket created: ${ticketLink}`);
    return ticketLink;
  } catch (error) {
    console.log(error)
    console.error('Error creating bug ticket:', error.response ? error.response.data : error.message);
  }
}

module.exports = {createBugTicket};
