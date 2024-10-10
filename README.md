# Capsule Demo Telegram Bot

This project is a Telegram bot to demo the usage of [Capsule](https://usecapsule.com) and more specifically, [Pregen Wallets](https://docs.usecapsule.com/integration-guides/wallet-pregeneration) by Capsule to safely and securely create wallets and sign transactions.

## Features

- Generates a pregen EVM and a SOLANA wallet for the user with their telegram identifier.
- Users can load up the generated wallets with ETH and SOL, respectively, and send them to others through the bot. (The functionality is for the sole purpose to demo transaction signing with Capsule ,Viem & @solana/web3.js)  

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/DegenHouseDeFi/capsule-telegram-bot-demo
   ```
2. Navigate to the project directory:
   ```sh
   cd capsule-telegram-bot-demo
   ```
3. Install dependencies:
   ```sh
   yarn # or pnpm/npm i
   ```

## Usage

1. Set up your environment variables:

   ```sh
   cp .env.example .env
   ```

   Edit the `.env` file with your variables.

   - `BOT_TOKEN` - Acquire a Telegram Bot Key from [BotFather](https://t.me/BotFather) (super easy)
   - `MONGO_URI` - This demo uses MongoDB to store user data.
   - `CAPSULE_API_KEY` - Generate the API Key at the [Developer Console](https://developer.usecapsule.com/)
   - `RPC` - The Bot is configured to be running on [Base](https://base.org). Either put in a Base RPC or a local fork of Base running on Anvil.
   - `DOMAIN` - As Capsule currently doesn't support Telegram IDs as an identifier, we use a work-around that appends the `DOMAIN` to a users TG ID. For example, Telegram ID `11211` becomes `11211@{DOMAIN}`. You can use any domain that you control over here.

2. Start the bot:
   ```sh
   yarn start # or yarn dev for hot-reloading
   ```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request. If you have any questions, feel free to shoot an email at `gm@degenhouse.sh`.

## Note

- We highly recommend encrypting the `userShare` before storing it in database for production use-cases.
