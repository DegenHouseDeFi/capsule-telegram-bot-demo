import { generateAccount, sendTransaction } from "./wallet";
import { User } from "../db/models";
import { createPublicClient, http, formatEther } from "viem";
import { base } from "viem/chains";
import { BotContext } from "./types";
import { type Conversation } from "@grammyjs/conversations";

/**
 * Handle the /start command for the Telegram bot.
 * If the user is already registered, it retrieves and displays their wallet address.
 * Otherwise, it generates a new account and stores the user in the database.
 *
 * @param {Context} ctx - Telegram context for the command
 * @returns {Promise<void>} - Returns a promise that resolves when the function is complete
 */
export async function handleStart(ctx: BotContext): Promise<void> {
  const telegramId = ctx.from?.id.toString();
  const username = ctx.from?.username?.toString() || telegramId;

  if (!telegramId) {
    await ctx.reply("An error occurred. Please try again.");
    return;
  }

  // Check if user already exists in the database
  let user = await User.findOne({ telegramId: telegramId });

  if (user) {
    await ctx.reply(
      `<b>Looks like you are already registered !</b>\n\n<b>👜 Address:</b> <code>${user.address}</code>`,
      { parse_mode: "HTML", link_preview_options: { is_disabled: true } }
    );
  } else {
    try {
      // Create a new account
      const account = await generateAccount(telegramId);
      const userShare = account.share;
      const walletAddress = account.wallet.address;

      if (!walletAddress) {
        await ctx.reply("Failed to create an account. Please try again.");
        return;
      }

      // Save the new user in the database
      user = new User({
        telegramId,
        username,
        userShare,
        address: walletAddress,
      });

      await user.save();

      await ctx.reply(
        `<b>🎉 Your wallet has been created!</b>\n\n<b>👜 Address:</b> <code>${walletAddress}</code>`,
        { parse_mode: "HTML", link_preview_options: { is_disabled: true } }
      );
    } catch (err) {
      console.error(err);
      await ctx.reply(
        "An error occurred while creating your account. Please try again."
      );
    }
  }
}


/**
 * Handle the /wallet command for the Telegram bot.
 * Displays the user's wallet address and current balance in ETH.
 *
 * @param {Context} ctx - Telegram context for the command
 * @returns {Promise<void>} - Returns a promise that resolves when the function is complete
 */
export async function handleWallet(ctx: BotContext): Promise<void> {
  const telegramId = ctx.from?.id.toString();

  if (!telegramId) {
    await ctx.reply("An error occurred. Please try again.");
    return;
  }

  // Retrieve user from the database
  const user = await User.findOne({ telegramId });

  if (!user) {
    await ctx.reply("No account found for this user.");
    return;
  }

  const walletAddress = user.address;

  // Display the user's wallet address
  await ctx.reply(
    `<b><u>Your Wallet</u></b>\n\n<b>👜 Address:</b> <code>${walletAddress}</code>\n`,
    { parse_mode: "HTML", link_preview_options: { is_disabled: true } }
  );

  try {
    // Initialize public client for interacting with blockchain
    const client = createPublicClient({
      chain: base,
      transport: http(process.env.RPC!),
    });

    // Get wallet balance in Wei
    const balance = await client.getBalance({
      address: walletAddress as `0x${string}`,
    });

    // Convert balance to ETH and format
    const formattedBalance = formatEther(balance);

    // Reply with the formatted balance in ETH
    await ctx.reply(`<b>💰 Balance:</b> <code>${formattedBalance} ETH</code>`, {
      parse_mode: "HTML",
    });
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    await ctx.reply("An error occurred while fetching your wallet balance.");
  }
}


/**
 * Handle the /send command for the Telegram bot.
 * Prompts the user to provide a wallet address for sending funds and the amount of ETH to be send.
 *
 * @param {Conversation} conversation - The conversation instance that manages the multi-step interaction.
 * @param {Context} ctx - Telegram context for the command
 * @returns {Promise<void>} - Returns a promise that resolves when the function is complete
 */
export async function transferConversation(
  conversation: Conversation<BotContext>,
  ctx: BotContext
) {
  const telegramId = ctx.from?.id.toString();

  if (!telegramId) {
    await ctx.reply("An error occurred. Please try again.");
    return;
  }

  // Retrieve the user's account from the database
  const user = await User.findOne({ telegramId });

  if (!user) {
    await ctx.reply("No account found for this user. Please register first.");
    return;
  }

  // Step 1: Ask for the destination address
  await ctx.reply(
    "Kindly provide the wallet address where you'd like to send the funds:",
    {
      reply_markup: {
        force_reply: true,
      },
    }
  );

  const destAddressMessage = await conversation.waitFor("message:text");
  const destAddress = destAddressMessage.message.text;

  // Validate Ethereum address format
  if (!destAddress.startsWith("0x") || destAddress.length !== 42) {
    await ctx.reply(
      "Invalid Ethereum address. Please provide a valid address."
    );
    return;
  }

  // Step 2: Ask for the amount of ETH to send
  await ctx.reply("How much ETH would you like to send?", {
    reply_markup: {
      force_reply: true,
    },
  });

  const amountMessage = await conversation.waitFor("message:text");
  const amountInETH = amountMessage.message.text;

  // Step 3: Validate amount (ensure it's a valid number)
  if (isNaN(parseFloat(amountInETH)) || parseFloat(amountInETH) <= 0) {
    await ctx.reply("Please provide a valid amount of ETH to send.");
    return;
  }

  // Step 4: Perform the transaction
  try {
    const res = await sendTransaction(user, amountInETH, destAddress);

    await ctx.reply(
      `Successfully sent ${amountInETH} ETH to ${destAddress}. Transaction Hash: ${res.tx}`
    );
  } catch (error) {
    console.error("Error sending transaction:", error);
    await ctx.reply("Failed to send transaction. Please try again.");
  }
}
