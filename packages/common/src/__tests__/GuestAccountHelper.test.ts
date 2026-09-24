import { GuestAccountHelper } from '../GuestAccountHelper';

describe('GuestAccountHelper', () => {
  it('builds a guest email under the reserved domain', () => {
    expect(GuestAccountHelper.buildEmail('ABC-123')).toBe('guest-abc-123@guest.example.com');
  });

  it('uses a domain with a real top-level domain, Directus rejects others on login', () => {
    expect(GuestAccountHelper.buildEmail('abc')).toMatch(/@guest\.example\.com$/);
  });

  it('does not treat the former .invalid guest emails as guest emails', () => {
    expect(GuestAccountHelper.isGuestEmail('guest-abc@guest.invalid')).toBe(false);
  });

  it('recognizes guest emails case-insensitively', () => {
    expect(GuestAccountHelper.isGuestEmail('guest-abc@guest.example.com')).toBe(true);
    expect(GuestAccountHelper.isGuestEmail(' Guest-ABC@Guest.Example.Com ')).toBe(true);
  });

  it('does not treat other emails as guest emails', () => {
    expect(GuestAccountHelper.isGuestEmail('guest-abc@example.com')).toBe(false);
    expect(GuestAccountHelper.isGuestEmail('someone@guest.example.com')).toBe(false);
    expect(GuestAccountHelper.isGuestEmail(null)).toBe(false);
    expect(GuestAccountHelper.isGuestEmail(undefined)).toBe(false);
    expect(GuestAccountHelper.isGuestEmail('')).toBe(false);
  });

  it('validates stored credentials', () => {
    expect(GuestAccountHelper.isValidCredentials({ email: 'guest-a@guest.example.com', password: 'secret' })).toBe(true);
    expect(GuestAccountHelper.isValidCredentials({ email: 'guest-a@guest.example.com', password: '' })).toBe(false);
    expect(GuestAccountHelper.isValidCredentials({ email: 'user@example.com', password: 'secret' })).toBe(false);
    expect(GuestAccountHelper.isValidCredentials(null)).toBe(false);
    expect(GuestAccountHelper.isValidCredentials('guest')).toBe(false);
  });

  it('builds the default nickname Guest_<YYMMDDHHmm> in the given time zone', () => {
    const date = new Date('2026-09-23T19:51:00Z');
    expect(GuestAccountHelper.buildDefaultNickname(date, 'Europe/Berlin')).toBe('Guest_2609232151');
    expect(GuestAccountHelper.buildDefaultNickname(date, 'UTC')).toBe('Guest_2609231951');
  });

  it('pads single digits and uses 00 for midnight', () => {
    const date = new Date('2027-01-02T23:05:00Z');
    expect(GuestAccountHelper.buildDefaultNickname(date, 'Europe/Berlin')).toBe('Guest_2701030005');
  });

  it('treats a profile as verified as soon as one linked account is not a guest', () => {
    expect(GuestAccountHelper.isVerifiedProfile([])).toBe(false);
    expect(GuestAccountHelper.isVerifiedProfile(['guest-abc@guest.example.com'])).toBe(false);
    expect(GuestAccountHelper.isVerifiedProfile(['guest-abc@guest.example.com', 'max@example.org'])).toBe(true);
    // SSO accounts have no email and are verified by their provider
    expect(GuestAccountHelper.isVerifiedProfile(['guest-abc@guest.example.com', null])).toBe(true);
  });

  it('restricts guests only while their profile is not verified', () => {
    expect(GuestAccountHelper.isRestrictedGuest('guest-abc@guest.example.com', null)).toBe(true);
    expect(GuestAccountHelper.isRestrictedGuest('guest-abc@guest.example.com', false)).toBe(true);
    expect(GuestAccountHelper.isRestrictedGuest('guest-abc@guest.example.com', true)).toBe(false);
    expect(GuestAccountHelper.isRestrictedGuest('max@example.org', false)).toBe(false);
  });
});
