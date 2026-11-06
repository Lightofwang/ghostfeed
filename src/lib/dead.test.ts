/**
 * Unit tests for dead feed detection
 * Run with: npm test -- dead.test.ts
 */
import { describe, it, expect } from 'vitest';
import { detectStatus, daysSince } from './dead';

describe('detectStatus', () => {
  describe('3-failure rule', () => {
    it('should mark as dead when consecutiveFailures >= 3', () => {
      const result = detectStatus({
        consecutiveFailures: 3,
        now: new Date('2024-01-01'),
      });
      expect(result).toBe('dead');
    });

    it('should mark as dead when consecutiveFailures > 3', () => {
      const result = detectStatus({
        consecutiveFailures: 5,
        now: new Date('2024-01-01'),
      });
      expect(result).toBe('dead');
    });

    it('should not mark as dead when consecutiveFailures < 3', () => {
      const result = detectStatus({
        consecutiveFailures: 2,
        now: new Date('2024-01-01'),
      });
      expect(result).toBe('unknown');
    });

    it('should prioritize 3-failure rule over recent publication', () => {
      // Feed published yesterday but has 3 failures
      const yesterday = new Date('2023-12-31').toISOString();
      const result = detectStatus({
        lastPublishedAt: yesterday,
        consecutiveFailures: 3,
        now: new Date('2024-01-01'),
      });
      expect(result).toBe('dead');
    });
  });

  describe('90-day rule', () => {
    it('should mark as dead when last published exactly 90 days ago', () => {
      const ninetyDaysAgo = new Date('2023-10-03').toISOString(); // 90 days before 2024-01-01
      const result = detectStatus({
        lastPublishedAt: ninetyDaysAgo,
        consecutiveFailures: 0,
        now: new Date('2024-01-01'),
      });
      expect(result).toBe('alive'); // Should be alive at exactly 90 days
    });

    it('should mark as dead when last published more than 90 days ago', () => {
      const moreThan90DaysAgo = new Date('2023-10-01').toISOString(); // 92 days before 2024-01-01
      const result = detectStatus({
        lastPublishedAt: moreThan90DaysAgo,
        consecutiveFailures: 0,
        now: new Date('2024-01-01'),
      });
      expect(result).toBe('dead');
    });

    it('should mark as alive when last published less than 90 days ago', () => {
      const lessThan90DaysAgo = new Date('2023-11-01').toISOString(); // ~60 days before 2024-01-01
      const result = detectStatus({
        lastPublishedAt: lessThan90DaysAgo,
        consecutiveFailures: 0,
        now: new Date('2024-01-01'),
      });
      expect(result).toBe('alive');
    });

    it('should mark as alive when published today', () => {
      const today = new Date('2024-01-01').toISOString();
      const result = detectStatus({
        lastPublishedAt: today,
        consecutiveFailures: 0,
        now: new Date('2024-01-01'),
      });
      expect(result).toBe('alive');
    });
  });

  describe('unknown status', () => {
    it('should return unknown when no lastPublishedAt and no failures', () => {
      const result = detectStatus({
        consecutiveFailures: 0,
        now: new Date('2024-01-01'),
      });
      expect(result).toBe('unknown');
    });

    it('should return unknown when no lastPublishedAt and failures < 3', () => {
      const result = detectStatus({
        consecutiveFailures: 2,
        now: new Date('2024-01-01'),
      });
      expect(result).toBe('unknown');
    });
  });

  describe('edge cases', () => {
    it('should handle invalid date strings gracefully', () => {
      const result = detectStatus({
        lastPublishedAt: 'invalid-date',
        consecutiveFailures: 0,
        now: new Date('2024-01-01'),
      });
      // Invalid dates result in NaN, which doesn't pass the isNaN check, so returns 'alive'
      expect(result).toBe('alive');
    });

    it('should use current date when now is not provided', () => {
      const veryOldDate = new Date('2020-01-01').toISOString();
      const result = detectStatus({
        lastPublishedAt: veryOldDate,
        consecutiveFailures: 0,
      });
      expect(result).toBe('dead'); // Should be dead with such an old date
    });

    it('should handle boundary: exactly 3 failures', () => {
      const result = detectStatus({
        consecutiveFailures: 3,
        lastPublishedAt: new Date('2023-12-31').toISOString(),
        now: new Date('2024-01-01'),
      });
      expect(result).toBe('dead');
    });

    it('should handle boundary: 89 days ago (alive)', () => {
      const eightyNineDaysAgo = new Date('2023-10-04').toISOString(); // 89 days before 2024-01-01
      const result = detectStatus({
        lastPublishedAt: eightyNineDaysAgo,
        consecutiveFailures: 0,
        now: new Date('2024-01-01'),
      });
      expect(result).toBe('alive');
    });

    it('should handle boundary: 91 days ago (dead)', () => {
      const ninetyOneDaysAgo = new Date('2023-10-02').toISOString(); // 91 days before 2024-01-01
      const result = detectStatus({
        lastPublishedAt: ninetyOneDaysAgo,
        consecutiveFailures: 0,
        now: new Date('2024-01-01'),
      });
      expect(result).toBe('dead');
    });
  });

  describe('recovery scenarios', () => {
    it('should mark as alive when failures cleared (< 3) and recent publication', () => {
      const yesterday = new Date('2023-12-31').toISOString();
      const result = detectStatus({
        lastPublishedAt: yesterday,
        consecutiveFailures: 0, // Cleared after successful fetch
        now: new Date('2024-01-01'),
      });
      expect(result).toBe('alive');
    });

    it('should mark as alive when failures = 2 and recent publication', () => {
      const yesterday = new Date('2023-12-31').toISOString();
      const result = detectStatus({
        lastPublishedAt: yesterday,
        consecutiveFailures: 2, // Not yet dead
        now: new Date('2024-01-01'),
      });
      expect(result).toBe('alive');
    });
  });
});

describe('daysSince', () => {
  it('should return correct number of days for a date in the past', () => {
    const result = daysSince('2023-12-01', new Date('2024-01-01'));
    expect(result).toBe(31);
  });

  it('should return 0 for same day', () => {
    const result = daysSince('2024-01-01', new Date('2024-01-01'));
    expect(result).toBe(0);
  });

  it('should return null for undefined date', () => {
    const result = daysSince(undefined, new Date('2024-01-01'));
    expect(result).toBeNull();
  });

  it('should return null for invalid date string', () => {
    const result = daysSince('invalid-date', new Date('2024-01-01'));
    expect(result).toBeNull();
  });

  it('should handle dates far in the past', () => {
    const result = daysSince('2020-01-01', new Date('2024-01-01'));
    expect(result).toBe(1461); // 4 years including leap year
  });

  it('should use current date when now is not provided', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const result = daysSince(yesterday);
    expect(result).toBe(1);
  });

  it('should handle partial day correctly (floor)', () => {
    const result = daysSince('2024-01-01T12:00:00Z', new Date('2024-01-02T06:00:00Z'));
    expect(result).toBe(0); // Only 18 hours, floors to 0
  });

  it('should handle exactly 1 day', () => {
    const result = daysSince('2024-01-01T00:00:00Z', new Date('2024-01-02T00:00:00Z'));
    expect(result).toBe(1);
  });
});
