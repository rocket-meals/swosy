import { GuestAccountHelper } from '../GuestAccountHelper';

describe('GuestAccountHelper', () => {
  it('builds a guest email under the reserved domain', () => {
    expect(GuestAccountHelper.buildEmail('ABC-123')).toBe('guest-abc-123@guest.invalid');
  });

  it('recognizes guest emails case-insensitively', () => {
    expect(GuestAccountHelper.isGuestEmail('guest-abc@guest.invalid')).toBe(true);
    expect(GuestAccountHelper.isGuestEmail(' Guest-ABC@Guest.Invalid ')).toBe(true);
  });

  it('does not treat other emails as guest emails', () => {
    expect(GuestAccountHelper.isGuestEmail('guest-abc@example.com')).toBe(false);
    expect(GuestAccountHelper.isGuestEmail('someone@guest.invalid')).toBe(false);
    expect(GuestAccountHelper.isGuestEmail(null)).toBe(false);
    expect(GuestAccountHelper.isGuestEmail(undefined)).toBe(false);
    expect(GuestAccountHelper.isGuestEmail('')).toBe(false);
  });

  it('validates stored credentials', () => {
    expect(GuestAccountHelper.isValidCredentials({ email: 'guest-a@guest.invalid', password: 'secret' })).toBe(true);
    expect(GuestAccountHelper.isValidCredentials({ email: 'guest-a@guest.invalid', password: '' })).toBe(false);
    expect(GuestAccountHelper.isValidCredentials({ email: 'user@example.com', password: 'secret' })).toBe(false);
    expect(GuestAccountHelper.isValidCredentials(null)).toBe(false);
    expect(GuestAccountHelper.isValidCredentials('guest')).toBe(false);
  });
});
