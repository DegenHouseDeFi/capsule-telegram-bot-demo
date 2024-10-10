import Capsule, { WalletType, Environment } from "@usecapsule/server-sdk";
import dotenv from "dotenv";
import { createCapsuleViemClient } from "@usecapsule/viem-v2-integration";
import { base } from "viem/chains";
import { http } from "viem";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import * as solana from "@solana/web3.js";
import { CapsuleSolanaWeb3Signer } from "@usecapsule/solana-web3.js-v1-integration";

dotenv.config();
const CAPSULE_API_KEY = process.env.CAPSULE_API_KEY;
const DOMAIN = process.env.DOMAIN;

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
    `${telegramId}@${DOMAIN}`
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
  const typedReceiver = receiverAddress as `0x${string}`;

  // Initialize Capsule with the user's share to authenticate the transaction
  const capsule = new Capsule(
    Environment.DEVELOPMENT,
    process.env.CAPSULE_API_KEY
  );
  capsule.setUserShare(user.evmUserShare);

  // Create the Viem client using Capsule for the Ethereum network (base chain)
  const client = createCapsuleViemClient(capsule, {
    chain: base,
    transport: http(process.env.RPC!),
  });

  // Convert the ETH amount from a string into Wei (the smallest unit of Ether)
  const amountInWei = BigInt(Number(amountInETH) * 10 ** 18);

  // Main transaction body
  const tx = await client.sendTransaction({
    to: typedReceiver, // Recipient's Ethereum address
    value: amountInWei, // Amount to send in Wei
    account: client.account!, // Sender's account information
    chain: base, // Ethereum chain to process the transaction
  });

  // Log the transaction hash for reference
  console.log("Transaction Hash:", tx);

  // Return the transaction details (including the transaction hash)
  return { tx };
}

/**
 * Generates a new Solana wallet using Capsule SDK.
 * The wallet is linked to the user's Telegram ID, and Capsule's user share is used for further interactions.
 *
 * @param {string} telegramId - The unique identifier for the Telegram user.
 * @returns {Promise<{wallet: any, share: string}>} - A promise that resolves to an object containing the generated wallet and user share.
 */
export async function generateSolanaAccount(telegramId: string) {
  // Change the environment based on your needs (Development, Production, Beta)
  const capsule = new Capsule(Environment.DEVELOPMENT, CAPSULE_API_KEY, {
    supportedWalletTypes: {
      [WalletType.SOLANA]: true,
    },
  });

  // Capsule supports EVM, Solana, and Cosmos wallets.
  const pregenWallet = await capsule.createWalletPreGen(
    WalletType.SOLANA,
    `${telegramId}@${DOMAIN}`
  );

  const share = capsule.getUserShare();

  return { wallet: pregenWallet, share };
}


/**
 * Send a transaction on the Solana network using Capsule.
 *
 * @param {any} user - The user object, containing information such as the user's Solana share.
 * @param {string} destAddress - The recipient's Solana wallet address.
 * @param {string} amountInSOL - The amount of SOL to send.
 * @returns {Promise<object>} - Returns the transaction result including txHash.
 */
export async function sendSolanaTransaction(
  user: any,
  destAddress: string,
  amountInSOL: number
): Promise<any> {
  try {
    // Initialize Capsule client
    const capsule = new Capsule(
      Environment.DEVELOPMENT,
      process.env.CAPSULE_API_KEY!,
      {
        supportedWalletTypes: {
          [WalletType.SOLANA]: true,
        },
      }
    );

    // Set the user share for the Solana wallet
    capsule.setUserShare(user.solanaUserShare);

    // Setup Solana connection to Devnet
    const solanaConnection = new solana.Connection(
      solana.clusterApiUrl("devnet"),
      "confirmed"
    );

    // Initialize Capsule Solana signer
    const solanaSigner = new CapsuleSolanaWeb3Signer(capsule, solanaConnection);

    // Log the Solana Signer address to ensure it's valid
    console.log("Solana Signer Address:", solanaSigner.address);

    // Convert the Solana Signer address to a valid PublicKey
    const fromPublicKey = new PublicKey(user.solanaAddress);
    console.log("Sender Public Key:", fromPublicKey.toString());

    // Validate and log the recipient's public key
    const toPublicKey = new PublicKey(destAddress);
    console.log("Recipient Public Key:", toPublicKey.toString());

    // Ensure the recipient's public key is valid
    if (!PublicKey.isOnCurve(toPublicKey)) {
      throw new Error("Invalid recipient public key.");
    }

    const { blockhash } = await solanaConnection.getLatestBlockhash("confirmed");

    const transaction = new Transaction();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPublicKey;

    transaction.add(
      SystemProgram.transfer({
        fromPubkey: fromPublicKey, // Sender's public key
        toPubkey: toPublicKey, // Recipient's public key
        lamports: solana.LAMPORTS_PER_SOL * amountInSOL, // Convert SOL to lamports
      })
    );

    // Send the transaction using the signer
    const tx = await solanaSigner.sendTransaction(transaction, {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });

    // Log and return the transaction hash
    console.log("Transaction Hash:", tx);
    return { tx };
  } catch (error) {
    console.error("Error sending Solana transaction:", error);
    throw new Error("Failed to send SOL transaction");
  }
}
