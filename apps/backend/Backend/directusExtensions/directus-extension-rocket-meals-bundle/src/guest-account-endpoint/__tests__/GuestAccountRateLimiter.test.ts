import { describe, expect, it } from '@jest/globals';
import { GuestAccountRateLimiter } from '../GuestAccountRateLimiter';

describe('GuestAccountRateLimiter', () => {
  it('allows attempts up to the limit and blocks further ones', () => {
    const limiter = new GuestAccountRateLimiter(2, 1000);
    expect(limiter.tryConsume('1.2.3.4', 0)).toBe(true);
    expect(limiter.tryConsume('1.2.3.4', 10)).toBe(true);
    expect(limiter.tryConsume('1.2.3.4', 20)).toBe(false);
  });

  it('counts each key separately', () => {
    const limiter = new GuestAccountRateLimiter(1, 1000);
    expect(limiter.tryConsume('1.2.3.4', 0)).toBe(true);
    expect(limiter.tryConsume('5.6.7.8', 0)).toBe(true);
    expect(limiter.tryConsume('1.2.3.4', 0)).toBe(false);
  });

  it('allows new attempts once the window has passed', () => {
    const limiter = new GuestAccountRateLimiter(1, 1000);
    expect(limiter.tryConsume('1.2.3.4', 0)).toBe(true);
    expect(limiter.tryConsume('1.2.3.4', 999)).toBe(false);
    expect(limiter.tryConsume('1.2.3.4', 1001)).toBe(true);
  });
});
