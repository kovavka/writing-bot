# Telegram writing bots

## Demo

[Word-count bot](https://t.me/pero_from_coven_bot)

[Sprint bot](https://t.me/meows_from_coven_bot)

## Set up

### Install modules

```shell
nvm use
npm install
```

### Create Database

```shell
npm run db:update:pero
npm run db:update:meows
```

### Add .env file

Copy example env file and use your own test bot token as a token for both Pero and Meows. Use your own user id as ADMIN_ID

```shell
cp .env.example .env
```

## Usage

Run the bot:

```shell
npm run run:dev:pero
```

or

```shell
npm run run:dev:meows
```

> Do not run both bots at the same time if using the same token.

Then send `/start` command to your test bot and follow the instructions.
