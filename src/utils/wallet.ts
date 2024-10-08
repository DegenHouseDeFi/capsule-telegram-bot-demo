import Capsule, { WalletType, Environment } from "@usecapsule/server-sdk";
import dotenv from "dotenv";
import { createCapsuleViemClient } from "@usecapsule/viem-v2-integration";
import { base } from "viem/chains";
import { http } from "viem";

dotenv.config();
const CAPSULE_API_KEY = process.env.CAPSULE_API_KEY;

/**
 * Generates a new Ethereum wallet using Capsule SDK.
 * The wallet is linked to the user's Telegram ID, and Capsule's user share is used for further interactions.
 *
 * @param {string} telegramId - The unique identifier for the Telegram user.
 * @returns {Promise<{wallet: any, share: string}>} - A promise that resolves to an object containing the generated wallet and user share.
 */
export async function generateAccount(telegramId: string) {
  // Change the environment based on your needs (Development, Production, Beta)
  const capsule = new Capsule(Environment.DEVELOPMENT, CAPSULE_API_KEY);

  // Capsule supports EVM, Solana and Cosmos wallets.
  const pregenWallet = await capsule.createWalletPreGen(
    WalletType.EVM,
    `${telegramId}@test.com`
  );
  const share = capsule.getUserShare();

  return { wallet: pregenWallet, share };
}

/**
 * Validates if the provided string is a valid Ethereum address.
 *
 * @param {string} address - The Ethereum address to validate.
 * @returns {boolean} - Returns true if the address is valid, otherwise false.
 */
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Sends an Ethereum transaction using Capsule and Viem.
 * This function handles the process of transferring ETH from the user's account to the specified receiver's address.
 *
 * @param {any} user - The user object, containing information such as the user's share.
 * @param {string} amountInETH - The amount of ETH to send, represented as a string.
 * @param {string} receiverAddress - The Ethereum address of the recipient.
 * @returns {Promise<{ tx: any }>} - A promise that resolves to the transaction hash upon successful transaction.
 */
export async function sendTransaction(
  user: any,
  amountInETH: string,
  receiverAddress: string
): Promise<{ tx: any }> {
  // Format the receiver address to ensure it's valid and compatible with Viem
  const formattedReceiverAddress = receiverAddress as `0x${string}`;

  // Initialize Capsule with the user's share to authenticate the transaction
  const capsule = new Capsule(
    Environment.DEVELOPMENT,
    process.env.CAPSULE_API_KEY
  );
  capsule.setUserShare(user.userShare);

  // Create the Viem client using Capsule for the Ethereum network (base chain)
  const client = createCapsuleViemClient(capsule, {
    chain: base,
    transport: http(process.env.RPC!),
  });

  // Convert the ETH amount from a string into Wei (the smallest unit of Ether)
  const amountInWei = BigInt(Number(amountInETH) * 10 ** 18);

  // Main transaction body
  const tx = await client.sendTransaction({
    to: formattedReceiverAddress, // Recipient's Ethereum address
    value: amountInWei, // Amount to send in Wei
    account: client.account!, // Sender's account information
    chain: base, // Ethereum chain to process the transaction
  });

  // Log the transaction hash for reference
  console.log("Transaction Hash:", tx);

  // Return the transaction details (including the transaction hash)
  return { tx };
}
