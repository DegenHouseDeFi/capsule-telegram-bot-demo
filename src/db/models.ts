import { Schema, model, Document } from "mongoose";

/**
 * Interface representing a User document in MongoDB.
 * Extends Mongoose's Document interface for typing.
 */
interface IUser extends Document {
  telegramId: string; // Telegram user ID, unique to each user
  username: string; // Username of the user on Telegram
  evmAddress: string; // User's associated Ethereum address (generated using Capsule SDK)
  evmUserShare: string; // User share is a crucial component of Capsule's 2/2 MPC (Multi-Party Computation) system
  solanaAddress: string; // User's Solana address
  solanaUserShare: string; // User's Solana UserShare
}

/**
 * Mongoose Schema for the User collection.
 * Defines the structure of the User document in MongoDB.
 */
const userSchema = new Schema<IUser>({
  telegramId: { type: String, required: true, unique: true }, // Unique Telegram ID for each user, required field
  username: { type: String, required: true }, // Username of the user, required field
  evmAddress: { type: String, required: true }, // User's Ethereum address, required field
  evmUserShare: { type: String, required: true }, // User's Ethereum share in the system, required field
  solanaAddress: { type: String, required: true }, // User's Solana address, required field
  solanaUserShare: { type: String, required: true }, // User's Solana share in the system, required field
});

/**
 * Creates an index on the telegramId field to improve query performance.
 * This ensures efficient lookups based on the Telegram ID.
 */
userSchema.index({ telegramId: 1 });

/**
 * Mongoose model for the User collection.
 * This model provides the interface for interacting with the User data in MongoDB.
 */
const User = model<IUser>("User", userSchema);

export { User };
