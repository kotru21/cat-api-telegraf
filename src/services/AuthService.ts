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

/**
 * Converts Uint8Array to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export class AuthService {
  private config: Config;

  constructor({ config }: { config: Config }) {
    this.config = config;
  }

  async validateTelegramData(data: TelegramAuthData) {
    const { hash, ...otherData } = data;

    // Create SHA-256 hash of bot token using Web Crypto API
    const botToken = this.config.BOT_TOKEN || '';
    const encoder = new TextEncoder();
    const tokenData = encoder.encode(botToken);
    const secretKeyBuffer = await crypto.subtle.digest('SHA-256', tokenData);

    const filteredData: Record<string, string> = {};
    for (const key in otherData) {
      if (otherData[key] !== undefined && otherData[key] !== null) {
        filteredData[key] = String(otherData[key]);
      }
    }

    // Create data check string
    const dataCheckString = Object.keys(filteredData)
      .sort()
      .map((key) => `${key}=${filteredData[key]}`)
      .join('\n');

    // Create HMAC-SHA256 using Web Crypto API
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      secretKeyBuffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(dataCheckString));

    const hmac = bytesToHex(new Uint8Array(signature));

    const isHashValid = hmac.toLowerCase() === hash.toLowerCase();
    const isTimeValid = Date.now() / 1000 - parseInt(otherData.auth_date) <= 86400;

    // Detailed logs only in development
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
