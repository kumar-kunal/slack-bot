const { App } = require('@slack/bolt');

require('dotenv').config();

const { channelConfigs } = require('./config');
const { ChannelToActionMapping } = require('./bot.constant');

const botApp = new App({
    token: process.env.SLACK_BOT_TOKEN, // Your bot user OAuth token
    signingSecret: process.env.SLACK_SIGNING_SECRET // Your app's signing secret
});


botApp.message(async ({ message, say, context }) => {
    const botMessage = message.message
    if ((message.thread_ts && message.thread_ts !== message.ts) ||(botMessage && botMessage.thread_ts !== botMessage.ts)) {
        console.log('Ignoring reply message in a thread');
        return;
    }

    const channelId = message.channel;
    const text = message.text;
    const { channelCode, channelName } = (channelConfigs || []).find(channelConfig => channelConfig.channelId === channelId) || {};
    const action = ChannelToActionMapping[channelCode];
    if (!action) {
        return;
    }
    const response = await action(text, channelName);
    await botApp.client.chat.postMessage({
        token: context.botToken,
        channel: channelId,
        text: response,
        thread_ts: message.thread_ts || message.ts
    });
});

(async () => {
    // Start your app
    await botApp.start(process.env.BOT_PORT || 3000);
    console.log(`⚡️ Bolt app is running at ${process.env.BOT_PORT} !`);
})();
