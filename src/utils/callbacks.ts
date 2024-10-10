import {
  generateAccount,
  sendTransaction,
  generateSolanaAccount,
  sendSolanaTransaction,
} from "./wallet";
import { User } from "../db/models";
import { createPublicClient, http, formatEther, isAddress } from "viem";
import { base } from "viem/chains";
import { BotContext } from "./types";
import { type Conversation } from "@grammyjs/conversations";
import { PublicKey } from "@solana/web3.js";
import * as solana from "@solana/web3.js";

/**
 * Handle the /start command for the Telegram bot.
 * If the user is already registered, it retrieves and displays their wallet addresses.
 * Otherwise, it generates new Ethereum and Solana accounts and stores the user in the database.
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
    await ctx.reply(`🚨 Looks like you are already registered!`, {
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
    });

    await handleWallet(ctx);
  } else {
    try {
      const msg = await ctx.reply(
        `♻️ Generating your wallets...(this may take a few seconds)`
      );

      // Create a new Ethereum account
      const ethAccount = await generateAccount(telegramId);
      const evmUserShare = ethAccount.share;
      const evmAddress = ethAccount.wallet.address;

      // Create a new Solana account
      const solanaAccount = await generateSolanaAccount(telegramId);
      const solanaUserShare = solanaAccount.share;
      const solanaAddress = solanaAccount.wallet.address;

      if (!evmAddress || !solanaAddress) {
        await ctx.api.editMessageText(
          msg.chat.id,
          msg.message_id,
          "😓 Failed to create an account. Please try again."
        );
        return;
      }

      // Save the new user in the database with both Ethereum and Solana wallets
      user = new User({
        telegramId,
        username,
        evmUserShare,
        evmAddress,
        solanaUserShare,
        solanaAddress,
      });

      await user.save();

      await ctx.api.editMessageText(
        msg.chat.id,
        msg.message_id,
        "<b>🎉 Your Ethereum and Solana wallets have been created!</b>",
        { parse_mode: "HTML" }
      );
      await handleWallet(ctx);
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
 * Displays the user's Ethereum and Solana wallet addresses and current balances.
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

  const { evmAddress, solanaAddress } = user;

  // Display the user's Ethereum and Solana wallet addresses
  await ctx.reply(
    `<b><u>Your Wallets</u></b>\n\n<b>👜 Ethereum Address:</b> <code>${evmAddress}</code>\n<b>👜 Solana Address:</b> <code>${solanaAddress}</code>\n`,
    { parse_mode: "HTML", link_preview_options: { is_disabled: true } }
  );

  try {
    // Fetch Ethereum wallet balance
    const client = createPublicClient({
      chain: base,
      transport: http(process.env.RPC!),
    });

    const ethBalance = await client.getBalance({
      address: evmAddress as `0x${string}`,
    });
    const formattedEthBalance = formatEther(ethBalance);

    // Display Ethereum balance
    await ctx.reply(
      `<b>💰 Ethereum Balance:</b> <code>${formattedEthBalance} ETH</code>`,
      {
        parse_mode: "HTML",
      }
    );

    // Fetch Solana wallet balance using Solana's web3.js : You can change the environment to mainnet/testnet or use a custom RPC
    const solanaConnection = new solana.Connection(
      solana.clusterApiUrl("devnet"),
      "confirmed"
    );
    const solanaPublicKey = new PublicKey(solanaAddress);
    const solBalance = await solanaConnection.getBalance(solanaPublicKey);
    const formattedSolBalance = (solBalance / 10 ** 9).toFixed(4);

    // Display Solana balance
    await ctx.reply(
      `<b>💰 Solana Balance:</b> <code>${formattedSolBalance} SOL</code>`,
      {
        parse_mode: "HTML",
      }
    );
  } catch (error) {
    console.error("Error fetching wallet balances:", error);
    await ctx.reply("An error occurred while fetching your wallet balances.");
  }
}

/**
 * Handle the /sendeth command for the Telegram bot.
 * Prompts the user to provide a wallet address for sending funds and the amount of ETH to be send.
 *
 * @param {Conversation} conversation - The conversation instance that manages the multi-step interaction.
 * @param {Context} ctx - Telegram context for the command
 * @returns {Promise<void>} - Returns a promise that resolves when the function is complete
 */
export async function transferETHConversation(
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
    "Kindly provide the wallet address where you'd like to send ETH:",
    {
      reply_markup: {
        force_reply: true,
      },
    }
  );

  const destAddressMessage = await conversation.waitFor("message:text");
  const destAddress = destAddressMessage.message.text;

  // Validate Ethereum address format
  if (!isAddress(destAddress)) {
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
  const msg = await ctx.reply(
    `♻️ Sending ${amountInETH} ETH to ${destAddress}...`
  );

  // Step 3: Validate amount (ensure it's a valid number)
  if (isNaN(parseFloat(amountInETH)) || parseFloat(amountInETH) <= 0) {
    await ctx.api.editMessageText(
      msg.chat.id,
      msg.message_id,
      "🚨 Invalid amount. Please provide a valid amount of ETH to send."
    );
    return;
  }

  // Step 4: Perform the transaction
  try {
    const res = await sendTransaction(user, amountInETH, destAddress);
    await ctx.api.editMessageText(
      msg.chat.id,
      msg.message_id,
      `✅ Successfully sent <code>${amountInETH} ETH</code> to <code>${destAddress}</code>.\n\nTransaction Hash: <code>${res.tx}</code>`,
      { parse_mode: "HTML" }
    );
  } catch (error) {
    console.error("Error sending transaction:", error);
    await ctx.api.editMessageText(
      msg.chat.id,
      msg.message_id,
      "🚨 Failed to send transaction. Please try again."
    );
  }
}

/**
 * Handle the transfer of SOL in a Telegram bot conversation.
 * Prompts the user to provide a wallet address and the amount of SOL to send.
 *
 * @param {Conversation} conversation - The conversation instance that manages the multi-step interaction.
 * @param {Context} ctx - Telegram context for the command.
 * @returns {Promise<void>} - Returns a promise that resolves when the function is complete.
 */
export async function transferSOLConversation(
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

  // Step 1: Ask for the destination Solana address
  await ctx.reply(
    "Kindly provide the wallet address where you'd like to send SOL:",
    {
      reply_markup: {
        force_reply: true,
      },
    }
  );

  const destAddressMessage = await conversation.waitFor("message:text");
  const destAddress = destAddressMessage.message.text;

  // Validate Solana address format
  if (!PublicKey.isOnCurve(destAddress)) {
    await ctx.reply("Invalid Solana address. Please provide a valid address.");
    return;
  }

  // Step 2: Ask for the amount of SOL to send
  await ctx.reply("How much SOL would you like to send?", {
    reply_markup: {
      force_reply: true,
    },
  });

  const amountMessage = await conversation.waitFor("message:text");
  const amountInSOL = amountMessage.message.text;
  const msg = await ctx.reply(
    `♻️ Sending ${amountInSOL} SOL to ${destAddress}...`
  );

  // Step 3: Validate amount (ensure it's a valid number)
  if (isNaN(parseFloat(amountInSOL)) || parseFloat(amountInSOL) <= 0) {
    await ctx.api.editMessageText(
      msg.chat.id,
      msg.message_id,
      "🚨 Invalid amount. Please provide a valid amount of SOL to send."
    );
    return;
  }

  // Step 4: Perform the SOL transaction using Capsule
  try {
    const res = await sendSolanaTransaction(
      user,
      destAddress,
      parseFloat(amountInSOL)
    );
    await ctx.api.editMessageText(
      msg.chat.id,
      msg.message_id,
      `✅ Successfully sent <code>${amountInSOL} SOL</code> to <code>${destAddress}</code>.\n\nTransaction Hash: <code>${res.tx}</code>`,
      { parse_mode: "HTML" }
    );
  } catch (error) {
    console.error("Error sending SOL transaction:", error);
    await ctx.api.editMessageText(
      msg.chat.id,
      msg.message_id,
      "🚨 Failed to send SOL transaction. Please try again."
    );
  }
}
