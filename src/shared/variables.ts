import path from 'path'
import { config } from 'dotenv'

const envConfigDir = path.resolve(__dirname, '../../.env')
config({
    path: envConfigDir
});

type EnvVariables = {
    TELEGRAM_BOT_TOKEN_PERO: string
    ADMIN_ID: string
}

export const { TELEGRAM_BOT_TOKEN_PERO, ADMIN_ID } = process.env as EnvVariables

export const TIME_ZONE = 'Europe/Moscow'
export const DATE_FORMAT = 'YYYY-MM-DD'