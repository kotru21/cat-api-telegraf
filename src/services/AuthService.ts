import crypto from 'crypto';
import logger from '../utils/logger.js';
import { Config } from '../config/types.js';

export interface TelegramAuthData {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string;
  hash: string;
  [key: string]: string | undefined;
}

export class AuthService {
  private config: Config;

  constructor({ config }: { config: Config }) {
    this.config = config;
  }

  validateTelegramData(data: TelegramAuthData) {
    const { hash, ...otherData } = data;

    // Проверка hash
    const botToken = this.config.BOT_TOKEN || '';
    const secretKey = crypto.createHash('sha256').update(botToken).digest();

    const filteredData: Record<string, string> = {};
    for (const key in otherData) {
      if (otherData[key] !== undefined && otherData[key] !== null) {
        filteredData[key] = String(otherData[key]);
      }
    }

    // Создаем строку для проверки в правильном формате
    const dataCheckString = Object.keys(filteredData)
      .sort()
      .map((key) => `${key}=${filteredData[key]}`)
      .join('\n');

    const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    const isHashValid = hmac.toLowerCase() === hash.toLowerCase();
    const isTimeValid = Date.now() / 1000 - parseInt(otherData.auth_date) <= 86400;

    // Детальные логи только в development
    if (process.env.NODE_ENV !== 'production') {
      logger.debug(
        {
          data,
          filteredData,
          dataCheckString,
          hmac,
          hash,
          isHashValid,
        },
        'AuthService: Telegram data validation details',
      );
    }

    return {
      isValid: isHashValid && isTimeValid,
      error: !isHashValid ? 'invalid_hash' : !isTimeValid ? 'expired' : null,
    };
  }
}
