import path from 'path'
import { config } from 'dotenv'

const envConfigDir = path.resolve(__dirname, '../../.env')
config({
  path: envConfigDir,
})

type EnvVariables = {
  TELEGRAM_BOT_TOKEN_PERO: string
  TELEGRAM_BOT_TOKEN_MEOWS: string
  ADMIN_ID: string
  TEST_CHAT_ID: string
}

export const { TELEGRAM_BOT_TOKEN_PERO, TELEGRAM_BOT_TOKEN_MEOWS, ADMIN_ID, TEST_CHAT_ID } =
  process.env as EnvVariables

export const TIME_ZONE = 'Europe/Moscow'
export const DATE_FORMAT = 'YYYY-MM-DD'
export const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm'

export const DATE_FORMAT_OUTPUT = 'DD.MM.YYYY'
export const TIME_FORMAT_OUTPUT = 'HH:mm'
