# Capsule Telegram Bot

This is a demo telegram bot powered by [Capsule pregen wallets](https://usecapsule.com/), it contains implementations for wallet creation and basic transactions of ETH on [Base](https://www.base.org/).

## Overview

Project Structure -

```bash
CAPSULE-TELEGRAM-BOT
|
|_src
     |_index.ts
     |
     |_db
         |_connection.ts
         |_models.ts
     |
     |_utils
           |_callbacks.ts
           |_wallet.ts
           |-types.ts
```

- We are using mongodb to store data -- this is the [src/db/schema](https://github.com/DegenHouseDeFi/capsule-telegram-bot/blob/main/src/db/models.ts) of that db which stores users.

- All the commands supported in this bot are present in [src/index.ts](https://github.com/DegenHouseDeFi/capsule-telegram-bot/blob/main/src/index.ts)

- The core functionality of all the commands is available in [src/utils/callbacks.ts](https://github.com/DegenHouseDeFi/capsule-telegram-bot/blob/main/src/utils/callbacks.ts)

## Commands

1. Start Command

```bash
/start
```

This command starts the bot and checks if the account is already generated for the associated telegramId of the user, if not then it generates the account and stores it in the mongodb database.

![start](https://res.cloudinary.com/dntuhdt9d/image/upload/v1727439626/Capsule%20Telegram%20Bot/o87rld91i3zpakwgedhu.png)

2. Wallet Command

```bash
/wallet
```

This commands fetches the wallet address and it's ETH balance

Wallet before topping up ETH

![walletb4topup](https://res.cloudinary.com/dntuhdt9d/image/upload/v1727439626/Capsule%20Telegram%20Bot/ongbk6pgjmu9pvzxelrx.png)

Wallet after topping up ETH

![walletaftertopup](https://res.cloudinary.com/dntuhdt9d/image/upload/v1727440088/Capsule%20Telegram%20Bot/ocwtck9lskjqr9lzny4c.png)

3. Sending Funds to another wallet

```bash
/send
```

1st Step -- Sending the receiver's address

![step1](https://res.cloudinary.com/dntuhdt9d/image/upload/v1727439626/Capsule%20Telegram%20Bot/onbjrk1smd99be5ba7g3.png)

2nd Step -- Sending the amount of ETH to be transferred

![step2](https://res.cloudinary.com/dntuhdt9d/image/upload/v1727439626/Capsule%20Telegram%20Bot/s01zredp7udzvalv1qjn.png)

Confirmation after transaction goes through

![confirmation](https://res.cloudinary.com/dntuhdt9d/image/upload/v1727439626/Capsule%20Telegram%20Bot/ydi9xbssm0fhvispy35u.png)
