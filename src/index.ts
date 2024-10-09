import dotenv from "dotenv";
import { Bot, session } from "grammy";
import {
  handleStart,
  handleWallet,
  transferConversation,
} from "./utils/callbacks";
import express from "express";
import { connectDB } from "./db/connection";
import { BotContext } from "./utils/types";
import { conversations, createConversation } from "@grammyjs/conversations";

dotenv.config();

// Initialize the Telegram Bot using the bot token from environment variables
const bot = new Bot<BotContext>(process.env.BOT_TOKEN!);

const commands = [
  {
    command: "start",
    description: "Start the bot and generate your wallet 🏦",
  },
  {
    command: "wallet",
    description: "Fetch your wallet details 🤑",
  },
  { command: "send", description: "Send ETH to any other wallet 💳" },
];
bot.api.setMyCommands(commands);

// Use the session and conversation middleware
bot.use(
  session({
    initial: () => ({}),
  })
);

// Register conversations middleware
bot.use(conversations());
bot.use(createConversation(transferConversation, "send"));

/**
 * Handle the /start command.
 * Sends a welcome message to the user and initiates the account creation process via handleStart.
 */
bot.command("start", async (ctx) => {
  // Send initial welcome message
  await ctx.reply(`Welcome! This bot is powered by <a href="https://usecapsule.com">Capsule</a> to securely generate, store, and manage user wallets 💫`,
    {
      parse_mode: "HTML",
    }
  );

  // Call handleStart to check if the user is already registered or to create a new account
  await handleStart(ctx);
});

/**
 * Handle the /wallet command.
 * Calls handleWallet to display the user's wallet information and balance.
 */
bot.command("wallet", async (ctx) => {
  await handleWallet(ctx);
});

/**
 * Handle the /send command.
 * Initiates the send process by asking the user for the recipient's wallet address and amount of ETH to be sent.
 */
bot.command("send", async (ctx) => {
  await ctx.conversation.enter("send");
});

// Create an Express server for handling HTTP requests
const app = express();
app.use(express.json());

const port = 3000;

/**
 * Start the Express server and initialize the MongoDB connection.
 * The Telegram bot is also started when the server starts.
 */
app.listen(port, async () => {
  // Connect to the MongoDB database
  await connectDB();

  // Start the Telegram bot
  bot.start();

  console.log(`Server is running on port ${port}`);
});
