const { replyToMessage } = require("./handlers/message-replier.handler");

const ChannelToActionMapping = {
    CH_1 : replyToMessage
}

module.exports = {ChannelToActionMapping}