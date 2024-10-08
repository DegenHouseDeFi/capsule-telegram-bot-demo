import mongoose from "mongoose";

/**
 * Asynchronously connects to the MongoDB database using the URI stored in the environment variable.
 * Logs the connection host if successful, or exits the process with failure if an error occurs.
 *
 * @returns {Promise<void>} - A promise that resolves when the connection is successful.
 */
const connectDB = async (): Promise<void> => {
  try {
    // Attempt to establish a connection to MongoDB using the provided URI
    const conn = await mongoose.connect(process.env.MONGO_URI!);
    console.log(`MongoDB connected: ${conn.connection.host}`); // Log the host if connection is successful
  } catch (error: any) {
    // Log the error and terminate the process in case of failure
    console.error(`Error: ${error.message}`);
    process.exit(1); // Exit the process with a non-zero status code
  }
};

/**
 * Asynchronously disconnects from the MongoDB database.
 * Logs a message if disconnection is successful, or exits the process with failure if an error occurs.
 *
 * @returns {Promise<void>} - A promise that resolves when the disconnection is successful.
 */
const disconnectDB = async (): Promise<void> => {
  try {
    // Attempt to disconnect from MongoDB
    await mongoose.disconnect();
    console.log("MongoDB disconnected"); // Log success message
  } catch (error: any) {
    // Log the error and terminate the process in case of failure
    console.error(`Error: ${error.message}`);
    process.exit(1); // Exit the process with a non-zero status code
  }
};

export { connectDB, disconnectDB };
