import { describe, it, expect } from '@jest/globals';
import { createLeaderboardRow } from '../../src/web/public/js/core/ui/leaderboard.ts';
import '../setup/setupEnv';

// Minimal PLACEHOLDER mock if needed
(global as any).PLACEHOLDER = { SMALL: '' };

describe('leaderboard UI', () => {
  it('generates link with encoded id', () => {
    const row = {
      position: 1,
      catId: 'ab c#',
      breedName: 'Test Breed',
      likes: 10,
      imageUrl: '',
    };
    const tr = createLeaderboardRow(row, 0);
    const link = tr.querySelector('a');
    expect(link).toBeTruthy();
    expect(link?.getAttribute('href')).toBe('/catDetails?id=ab%20c%23');
  });
});
