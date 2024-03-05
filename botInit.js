const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot(process.env.TELEGRAM_BOT_API_KEY, {
  polling: true,
});

module.exports = bot;