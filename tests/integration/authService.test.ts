import { describe, it, expect, beforeAll } from 'bun:test';
import { AuthService } from '../../src/services/AuthService.js';
import { isAllowedFeature, ALLOWED_CAT_FEATURES } from '../../src/database/CatRepository.js';

describe('AuthService', () => {
  let authService: AuthService;
  const testBotToken = 'test-bot-token-12345';

  beforeAll(() => {
    authService = new AuthService({
      config: {
        BOT_TOKEN: testBotToken,
        BOT_ENABLED: true,
        WEB_ENABLED: true,
        CAT_API_TOKEN: 'test',
        expressServerPort: 3000,
        websocketServerPort: 3000,
        apiPort: 3000,
        WEBSITE_URL: 'http://localhost',
        FULL_WEBSITE_URL: 'http://localhost:3000',
        SESSION_SECRET: 'test-secret-key-12345',
        NODE_ENV: 'test',
        REDIS_ENABLED: false,
        DATABASE_URL: 'file:./test.db',
        WS_MAX_CONNECTIONS_PER_IP: 5,
        WS_MESSAGE_RATE_LIMIT: 10,
      },
    });
  });

  describe('validateTelegramData', () => {
    it('should reject data with invalid hash', async () => {
      const currentAuthDate = Math.floor(Date.now() / 1000);

      const result = await authService.validateTelegramData({
        id: '123456',
        first_name: 'Test',
        auth_date: currentAuthDate.toString(),
        hash: 'invalid-hash',
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('invalid_hash');
    });

    it('should return isValid false for tampered data', async () => {
      const result = await authService.validateTelegramData({
        id: '999',
        first_name: 'Hacker',
        auth_date: Math.floor(Date.now() / 1000).toString(),
        hash: 'tampered-hash-abc123',
      });

      expect(result.isValid).toBe(false);
    });
  });
});

describe('CatRepository Feature Whitelist', () => {
  it('should allow valid features', () => {
    expect(isAllowedFeature('origin')).toBe(true);
    expect(isAllowedFeature('temperament')).toBe(true);
    expect(isAllowedFeature('life_span')).toBe(true);
    expect(isAllowedFeature('weight_imperial')).toBe(true);
    expect(isAllowedFeature('weight_metric')).toBe(true);
  });

  it('should reject invalid features', () => {
    expect(isAllowedFeature('sql_injection')).toBe(false);
    expect(isAllowedFeature('__proto__')).toBe(false);
    expect(isAllowedFeature('')).toBe(false);
    expect(isAllowedFeature('random')).toBe(false);
  });

  it('should have expected allowed features count', () => {
    expect(ALLOWED_CAT_FEATURES.length).toBe(5);
  });
});
